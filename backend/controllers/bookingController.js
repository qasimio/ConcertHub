// Location: D:\ConcertHub\backend\controllers\bookingController.js

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Artist = require('../models/Artist');

// ─── Helper: process payment from wallet ──────────────────────────────────────
const processWalletPayment = async (session, userId, amount, description, bookingId) => {
  const user = await User.findById(userId).session(session);

  if (user.walletBalance < amount) {
    throw new Error(
      `Insufficient wallet balance. You have $${user.walletBalance.toFixed(2)} but need $${amount.toFixed(2)}`
    );
  }

  const balanceBefore = user.walletBalance;
  user.walletBalance = parseFloat((user.walletBalance - amount).toFixed(2));
  await user.save({ session });

  const payment = await Payment.create(
    [
      {
        user: userId,
        booking: bookingId,
        amount,
        type: 'payment',
        status: 'success',
        walletBalanceBefore: balanceBefore,
        walletBalanceAfter: user.walletBalance,
        description,
      },
    ],
    { session }
  );

  return payment[0];
};

// ─── @POST /api/bookings ───────────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, ticketCount } = req.body;
    const count = parseInt(ticketCount) || 1;

    if (count < 1 || count > 10) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Ticket count must be between 1 and 10',
      });
    }

    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.approvalStatus !== 'approved' || event.status !== 'published') {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: 'This event is not available for booking' });
    }

    if (new Date(event.date) < new Date()) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'This event has already passed' });
    }

    if (event.availableSeats < count) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableSeats} seat(s) available`,
      });
    }

    // Check user doesn't already have a booking for this event
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      event: eventId,
      status: 'confirmed',
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this event',
      });
    }

    const totalPrice = parseFloat((event.price * count).toFixed(2));

    // Create booking first (to get the ID for payment)
    const booking = await Booking.create(
      [
        {
          user: req.user._id,
          event: eventId,
          ticketCount: count,
          pricePerTicket: event.price,
          totalPrice,
          status: 'confirmed',
        },
      ],
      { session }
    );

    // Process wallet payment
    const payment = await processWalletPayment(
      session,
      req.user._id,
      totalPrice,
      `Tickets for "${event.title}" (x${count})`,
      booking[0]._id
    );

    // Link payment to booking
    booking[0].payment = payment._id;
    await booking[0].save({ session });

    // Decrease available seats
    event.availableSeats -= count;
    event.totalBookings += 1;
    event.totalRevenue += totalPrice;
    await event.save({ session });

    // Update artist stats
    await Artist.findByIdAndUpdate(
      event.artist,
      {
        $inc: {
          totalEarnings: totalPrice,
          totalTicketsSold: count,
        },
      },
      { session }
    );

    await session.commitTransaction();

    const populatedBooking = await Booking.findById(booking[0]._id)
      .populate('event', 'title date venue bannerImage')
      .populate('payment', 'paymentId amount status');

    res.status(201).json({
      success: true,
      message: 'Booking confirmed!',
      booking: populatedBooking,
      newWalletBalance: (await User.findById(req.user._id)).walletBalance,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─── @GET /api/bookings/:id ───────────────────────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'event',
        select: 'title date venue price bannerImage artist cancellationDeadlineHours',
        populate: { path: 'artist', select: 'stageName profileImage' },
      })
      .populate('payment', 'paymentId amount status walletBalanceAfter createdAt');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only booking owner or admin can view
    if (
      req.user.role !== 'admin' &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/bookings/:id/cancel ────────────────────────────────────────────
const cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event')
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization
    if (
      req.user.role !== 'admin' &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (booking.status !== 'confirmed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status: ${booking.status}`,
      });
    }

    // Check cancellation deadline
    const event = booking.event;
    const hoursUntilEvent =
      (new Date(event.date) - new Date()) / (1000 * 60 * 60);

    if (hoursUntilEvent < event.cancellationDeadlineHours && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cancellations must be made at least ${event.cancellationDeadlineHours} hours before the event`,
      });
    }

    // Process refund to wallet
    const user = await User.findById(booking.user).session(session);
    const balanceBefore = user.walletBalance;
    user.walletBalance = parseFloat((user.walletBalance + booking.totalPrice).toFixed(2));
    await user.save({ session });

    // Create refund payment record
    await Payment.create(
      [
        {
          user: booking.user,
          booking: booking._id,
          amount: booking.totalPrice,
          type: 'refund',
          status: 'success',
          walletBalanceBefore: balanceBefore,
          walletBalanceAfter: user.walletBalance,
          description: `Refund for booking ${booking.booking_id}`,
          refundedBy: req.user._id,
          refundedAt: new Date(),
          refundReason: req.body.reason || 'User cancelled',
        },
      ],
      { session }
    );

    // Restore seats
    await Event.findByIdAndUpdate(
      event._id,
      {
        $inc: {
          availableSeats: booking.ticketCount,
          totalBookings: -1,
          totalRevenue: -booking.totalPrice,
        },
      },
      { session }
    );

    // Deduct artist stats
    await Artist.findByIdAndUpdate(
      event.artist,
      {
        $inc: {
          totalEarnings: -booking.totalPrice,
          totalTicketsSold: -booking.ticketCount,
        },
      },
      { session }
    );

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || '';
    await booking.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Booking cancelled. $${booking.totalPrice.toFixed(2)} refunded to your wallet.`,
      booking,
      newWalletBalance: user.walletBalance,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─── ADMIN: @GET /api/bookings ─────────────────────────────────────────────────
const getAllBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.eventId) filter.event = req.query.eventId;
    if (req.query.userId) filter.user = req.query.userId;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('event', 'title date venue price');

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getBookingById, cancelBooking, getAllBookings };