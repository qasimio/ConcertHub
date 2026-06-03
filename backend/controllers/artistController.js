// Location: D:\ConcertHub\backend\controllers\artistController.js

const Artist = require('../models/Artist');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

// ─── @GET /api/artists ─────────────────────────────────────────────────────────
const getAllArtists = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { verificationStatus: 'approved', isActive: true };

    if (req.query.genre) filter.genre = { $in: [req.query.genre] };
    if (req.query.search) {
      filter.$or = [
        { stageName: { $regex: req.query.search, $options: 'i' } },
        { bio: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Admin sees all
    if (req.user?.role === 'admin') {
      delete filter.verificationStatus;
      delete filter.isActive;
      if (req.query.verificationStatus) {
        filter.verificationStatus = req.query.verificationStatus;
      }
    }

    const total = await Artist.countDocuments(filter);
    const artists = await Artist.find(filter)
      .sort({ totalTicketsSold: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: artists.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      artists,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/artists/:id ─────────────────────────────────────────────────────
const getArtistById = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('user', 'name email createdAt')
      .populate({
        path: 'events',
        match: { approvalStatus: 'approved', status: 'published' },
        select: 'title date venue price availableSeats bannerImage averageRating',
        options: { sort: { date: 1 }, limit: 10 },
      });

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    res.status(200).json({ success: true, artist });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/artists/me ──────────────────────────────────────────────────────
const getMyArtistProfile = async (req, res, next) => {
  try {
    const artist = await Artist.findOne({ user: req.user._id }).populate(
      'user',
      'name email'
    );
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found. Please complete your profile.',
      });
    }
    res.status(200).json({ success: true, artist });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/artists/me ──────────────────────────────────────────────────────
const updateMyArtistProfile = async (req, res, next) => {
  try {
    const { stageName, bio, genre, socialLinks, cancellationDeadlineHours } = req.body;

    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist profile not found' });
    }

    if (stageName) artist.stageName = stageName;
    if (bio) artist.bio = bio;
    if (genre) artist.genre = Array.isArray(genre) ? genre : [genre];
    if (socialLinks) artist.socialLinks = { ...artist.socialLinks, ...socialLinks };

    // Upload profile image to Cloudinary
    if (req.files?.profileImage?.[0]) {
      const result = await uploadToCloudinary(
        req.files.profileImage[0].buffer,
        'concerthub/artists'
      );

      artist.profileImage = result.secure_url;
    }

    // Upload banner image to Cloudinary
    if (req.files?.bannerImage?.[0]) {
      const result = await uploadToCloudinary(
        req.files.bannerImage[0].buffer,
        'concerthub/artists'
      );

      artist.bannerImage = result.secure_url;
    }

    await artist.save();

    res.status(200).json({
      success: true,
      artist,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/artists/me/analytics ───────────────────────────────────────────
const getMyAnalytics = async (req, res, next) => {
  try {
    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist profile not found' });
    }

    // All events by this artist
    const events = await Event.find({ artist: artist._id });
    const eventIds = events.map((e) => e._id);

    // All confirmed bookings for those events
    const bookings = await Booking.find({
      event: { $in: eventIds },
      status: 'confirmed',
    }).populate('event', 'title date price');

    // Revenue by event
    const revenueByEvent = {};
    const ticketsByEvent = {};
    for (const b of bookings) {
      const eId = b.event._id.toString();
      revenueByEvent[eId] = (revenueByEvent[eId] || 0) + b.totalPrice;
      ticketsByEvent[eId] = (ticketsByEvent[eId] || 0) + b.ticketCount;
    }

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.find({
      event: { $in: eventIds },
      status: 'confirmed',
      createdAt: { $gte: sixMonthsAgo },
    });

    const monthlyRevenue = {};
    for (const b of monthlyBookings) {
      const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + b.totalPrice;
    }

    // Summary
    const totalEvents = events.length;
    const publishedEvents = events.filter((e) => e.status === 'published').length;
    const upcomingEvents = events.filter((e) => new Date(e.date) > new Date()).length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalTicketsSold = bookings.reduce((sum, b) => sum + b.ticketCount, 0);

    // Top 5 events by revenue
    const topEvents = events
      .map((e) => ({
        _id: e._id,
        title: e.title,
        date: e.date,
        revenue: revenueByEvent[e._id.toString()] || 0,
        ticketsSold: ticketsByEvent[e._id.toString()] || 0,
        availableSeats: e.availableSeats,
        totalSeats: e.totalSeats,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalEvents,
          publishedEvents,
          upcomingEvents,
          totalRevenue,
          totalTicketsSold,
          artistBalance: artist.totalEarnings,
        },
        topEvents,
        monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @PUT /api/artists/:id/approve ─────────────────────────────────────
const approveArtist = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Status must be approved or rejected' });
    }

    const artist = await Artist.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: status,
        rejectionReason: status === 'rejected' ? rejectionReason || '' : '',
      },
      { new: true }
    ).populate('user', 'name email');

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    res.status(200).json({
      success: true,
      message: `Artist ${status} successfully`,
      artist,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @GET /api/artists (all, including pending) ────────────────────────
// This is handled in getAllArtists with admin role check above

module.exports = {
  getAllArtists,
  getArtistById,
  getMyArtistProfile,
  updateMyArtistProfile,
  getMyAnalytics,
  approveArtist,
};