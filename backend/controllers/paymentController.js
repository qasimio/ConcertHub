// Location: D:\ConcertHub\backend\controllers\paymentController.js

const Payment = require('../models/Payment');
const User = require('../models/User');

// ─── @GET /api/payments/my ────────────────────────────────────────────────────
const getMyPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('booking', 'booking_id ticketCount');

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/payments/:id ────────────────────────────────────────────────────
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: { path: 'event', select: 'title date venue' },
      });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Only payment owner or admin can view
    if (
      req.user.role !== 'admin' &&
      payment.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @GET /api/payments ─────────────────────────────────────────────────
const getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user = req.query.userId;

    // Date range
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
    }

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('booking', 'booking_id');

    // Summary totals
    const totalRevenue = await Payment.aggregate([
      { $match: { type: 'payment', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRefunds = await Payment.aggregate([
      { $match: { type: 'refund', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalRefunds: totalRefunds[0]?.total || 0,
        netRevenue:
          (totalRevenue[0]?.total || 0) - (totalRefunds[0]?.total || 0),
      },
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @POST /api/payments/topup ─────────────────────────────────────────
// Admin can top up a user's wallet (e.g. for testing, goodwill credit)
const adminTopUp = async (req, res, next) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'userId and a positive amount are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const balanceBefore = user.walletBalance;
    user.walletBalance = parseFloat((user.walletBalance + Number(amount)).toFixed(2));
    await user.save();

    const payment = await Payment.create({
      user: userId,
      amount: Number(amount),
      type: 'topup',
      status: 'success',
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: user.walletBalance,
      description: description || `Admin top-up of $${amount}`,
      refundedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: `Wallet topped up by $${amount}`,
      newBalance: user.walletBalance,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyPayments, getPaymentById, getAllPayments, adminTopUp };