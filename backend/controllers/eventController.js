// Location: D:\ConcertHub\backend\controllers\eventController.js

const Event = require('../models/Event');
const Artist = require('../models/Artist');
const Booking = require('../models/Booking');

// ─── @GET /api/events ─────────────────────────────────────────────────────────
// Public: only approved+published events. Admin: all.
const getAllEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Base filter
    const filter = {};

    // Public users see only published+approved future/current events
    if (!req.user || req.user.role === 'user') {
      filter.approvalStatus = 'approved';
      filter.status = 'published';
    }

    // Artist sees only their own events (all statuses)
    if (req.user?.role === 'artist') {
      const artist = await Artist.findOne({ user: req.user._id });
      if (artist) filter.artist = artist._id;
    }

    // Filters from query
    if (req.query.genre) filter.genre = req.query.genre;
    if (req.query.city)
      filter['venue.city'] = { $regex: req.query.city, $options: 'i' };
    if (req.query.status && req.user?.role === 'admin') filter.status = req.query.status;
    if (req.query.approvalStatus && req.user?.role === 'admin')
      filter.approvalStatus = req.query.approvalStatus;

    // Date filters
    if (req.query.dateFrom) filter.date = { $gte: new Date(req.query.dateFrom) };
    if (req.query.dateTo)
      filter.date = { ...filter.date, $lte: new Date(req.query.dateTo) };

    // Price filters
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Sorting
    let sortBy = { date: 1 };
    if (req.query.sortBy === 'price_asc') sortBy = { price: 1 };
    if (req.query.sortBy === 'price_desc') sortBy = { price: -1 };
    if (req.query.sortBy === 'rating') sortBy = { averageRating: -1 };
    if (req.query.sortBy === 'newest') sortBy = { createdAt: -1 };

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate('artist', 'stageName profileImage genre verificationStatus');

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      events,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/events/:id ─────────────────────────────────────────────────────
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'artist',
      'stageName bio profileImage bannerImage genre socialLinks verificationStatus totalTicketsSold'
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Non-admin, non-artist can only see approved+published events
    if (
      req.user?.role !== 'admin' &&
      !(req.user?.role === 'artist') &&
      (event.approvalStatus !== 'approved' || event.status !== 'published')
    ) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/events ─────────────────────────────────────────────────────────
// Artist only
const createEvent = async (req, res, next) => {
  try {
    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) {
      return res.status(400).json({
        success: false,
        message: 'You must have an artist profile to create events',
      });
    }

    if (artist.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your artist profile must be approved before creating events',
      });
    }

    const {
      title, description, genre, date, endDate,
      venue, price, totalSeats, cancellationDeadlineHours, tags,
    } = req.body;

    const eventData = {
      title,
      description,
      genre,
      date,
      endDate,
      venue,
      price: Number(price),
      totalSeats: Number(totalSeats),
      artist: artist._id,
      cancellationDeadlineHours: cancellationDeadlineHours || 24,
      tags: tags || [],
    };

    if (req.files?.bannerImage) {
      eventData.bannerImage = `/uploads/events/${req.files.bannerImage[0].filename}`;
    }
    if (req.files?.images) {
      eventData.images = req.files.images.map((f) => `/uploads/events/${f.filename}`);
    }

    const event = await Event.create(eventData);
    await event.populate('artist', 'stageName profileImage');

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/events/:id ─────────────────────────────────────────────────────
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('artist');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Authorization: only artist owner or admin
    if (req.user.role !== 'admin') {
      const artist = await Artist.findOne({ user: req.user._id });
      if (!artist || event.artist._id.toString() !== artist._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this event',
        });
      }
    }

    const updatable = [
      'title', 'description', 'genre', 'date', 'endDate',
      'venue', 'price', 'totalSeats', 'cancellationDeadlineHours', 'tags', 'status',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    // Re-calculate available seats if totalSeats changed
    if (req.body.totalSeats) {
      const soldTickets = event.totalSeats - event.availableSeats;
      event.availableSeats = Number(req.body.totalSeats) - soldTickets;
    }

    if (req.files?.bannerImage) {
      event.bannerImage = `/uploads/events/${req.files.bannerImage[0].filename}`;
    }

    // If artist edits, reset approval
    if (req.user.role !== 'admin') {
      event.approvalStatus = 'pending';
    }

    await event.save();
    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// ─── @DELETE /api/events/:id ──────────────────────────────────────────────────
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Authorization
    if (req.user.role !== 'admin') {
      const artist = await Artist.findOne({ user: req.user._id });
      if (!artist || event.artist.toString() !== artist._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this event',
        });
      }
    }

    // Check if there are active bookings
    const activeBookings = await Booking.countDocuments({
      event: event._id,
      status: 'confirmed',
    });

    if (activeBookings > 0) {
      // Instead of deleting, cancel it
      event.status = 'cancelled';
      await event.save();
      return res.status(200).json({
        success: true,
        message: `Event cancelled (${activeBookings} active bookings exist — refunds must be processed)`,
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @PUT /api/events/:id/approve ──────────────────────────────────────
const approveEvent = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Status must be approved or rejected' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.approvalStatus = status;
    event.rejectionReason = status === 'rejected' ? rejectionReason || '' : '';

    // Auto-publish when approved
    if (status === 'approved' && event.status === 'draft') {
      event.status = 'published';
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: `Event ${status} successfully`,
      event,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
};