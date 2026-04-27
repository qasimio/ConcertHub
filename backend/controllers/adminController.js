// Location: D:\ConcertHub\backend\controllers\adminController.js

const User = require('../models/User');
const Artist = require('../models/Artist');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// ─── @GET /api/admin/dashboard ────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // === Counts ===
    const [
      totalUsers,
      activeUsers,
      totalArtists,
      pendingArtists,
      approvedArtists,
      totalEvents,
      publishedEvents,
      pendingEvents,
      upcomingEvents,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      newUsersLast30,
      newBookingsLast7,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, isActive: true }),
      Artist.countDocuments(),
      Artist.countDocuments({ verificationStatus: 'pending' }),
      Artist.countDocuments({ verificationStatus: 'approved' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'published', approvalStatus: 'approved' }),
      Event.countDocuments({ approvalStatus: 'pending' }),
      Event.countDocuments({ date: { $gt: now }, status: 'published' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, role: { $ne: 'admin' } }),
      Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo }, status: 'confirmed' }),
    ]);

    // === Revenue ===
    const revenueAgg = await Payment.aggregate([
      { $match: { type: 'payment', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const refundAgg = await Payment.aggregate([
      { $match: { type: 'refund', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalRefunds = refundAgg[0]?.total || 0;

    // === Monthly revenue (last 6 months) ===
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          type: 'payment',
          status: 'success',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // === Top 5 events by revenue ===
    const topEvents = await Event.find()
      .sort({ totalRevenue: -1 })
      .limit(5)
      .select('title date venue totalRevenue totalBookings averageRating')
      .populate('artist', 'stageName');

    // === Top 5 artists by earnings ===
    const topArtists = await Artist.find({ verificationStatus: 'approved' })
      .sort({ totalEarnings: -1 })
      .limit(5)
      .select('stageName profileImage genre totalEarnings totalTicketsSold')
      .populate('user', 'name email');

    // === Recent activity (last 5 bookings) ===
    const recentBookings = await Booking.find({ status: 'confirmed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('event', 'title date');

    res.status(200).json({
      success: true,
      dashboard: {
        // Alerts / action items
        alerts: {
          pendingArtists,
          pendingEvents,
        },
        // User stats
        users: {
          total: totalUsers,
          active: activeUsers,
          newLast30Days: newUsersLast30,
        },
        // Artist stats
        artists: {
          total: totalArtists,
          pending: pendingArtists,
          approved: approvedArtists,
        },
        // Event stats
        events: {
          total: totalEvents,
          published: publishedEvents,
          pending: pendingEvents,
          upcoming: upcomingEvents,
        },
        // Booking stats
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          newLast7Days: newBookingsLast7,
        },
        // Revenue stats
        revenue: {
          total: totalRevenue,
          refunds: totalRefunds,
          net: totalRevenue - totalRefunds,
        },
        // Charts
        monthlyRevenue,
        topEvents,
        topArtists,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/admin/tickets-stats ───────────────────────────────────────────
// Admin-specific: total tickets sold, available, by event
const getTicketStats = async (req, res, next) => {
  try {
    const events = await Event.find({ approvalStatus: 'approved' })
      .select('title date venue totalSeats availableSeats totalBookings totalRevenue averageRating status')
      .populate('artist', 'stageName')
      .sort({ date: 1 });

    const overall = await Event.aggregate([
      { $match: { approvalStatus: 'approved' } },
      {
        $group: {
          _id: null,
          totalSeats: { $sum: '$totalSeats' },
          availableSeats: { $sum: '$availableSeats' },
          totalRevenue: { $sum: '$totalRevenue' },
        },
      },
    ]);

    const stats = overall[0] || { totalSeats: 0, availableSeats: 0, totalRevenue: 0 };

    res.status(200).json({
      success: true,
      overall: {
        ...stats,
        soldSeats: stats.totalSeats - stats.availableSeats,
        occupancyRate: stats.totalSeats > 0
          ? parseFloat(
              (((stats.totalSeats - stats.availableSeats) / stats.totalSeats) * 100).toFixed(1)
            )
          : 0,
      },
      events: events.map((e) => ({
        _id: e._id,
        title: e.title,
        date: e.date,
        venue: e.venue,
        artist: e.artist,
        status: e.status,
        totalSeats: e.totalSeats,
        availableSeats: e.availableSeats,
        soldSeats: e.totalSeats - e.availableSeats,
        totalRevenue: e.totalRevenue,
        totalBookings: e.totalBookings,
        averageRating: e.averageRating,
        occupancyRate:
          e.totalSeats > 0
            ? parseFloat(
                (((e.totalSeats - e.availableSeats) / e.totalSeats) * 100).toFixed(1)
              )
            : 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/admin/users/:id/toggle-active ─────────────────────────────────
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot deactivate admin accounts' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @DELETE /api/admin/reviews/:id ──────────────────────────────────────────
// Admin can hard-delete or hide any review
const moderateReview = async (req, res, next) => {
  try {
    const { action } = req.body; // 'hide' or 'delete'
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (action === 'hide') {
      review.isVisible = false;
      await review.save();
      return res.status(200).json({ success: true, message: 'Review hidden' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getTicketStats,
  toggleUserActive,
  moderateReview,
};