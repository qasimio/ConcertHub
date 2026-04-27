// Location: D:\ConcertHub\backend\controllers\reviewController.js

const Review = require('../models/Review');
const Event = require('../models/Event');
const Artist = require('../models/Artist');
const Booking = require('../models/Booking');

// ─── Helper: recalculate & save average rating ────────────────────────────────
const updateAverageRating = async (targetType, targetId) => {
  const filter = targetType === 'event' ? { event: targetId } : { artist: targetId };
  const result = await Review.aggregate([
    { $match: { ...filter, isVisible: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avgRating = result[0] ? parseFloat(result[0].avgRating.toFixed(1)) : 0;
  const reviewCount = result[0] ? result[0].count : 0;

  if (targetType === 'event') {
    await Event.findByIdAndUpdate(targetId, { averageRating: avgRating, reviewCount });
  } else {
    await Artist.findByIdAndUpdate(targetId, { averageRating: avgRating, reviewCount });
  }
};

// ─── @POST /api/reviews/event/:eventId ────────────────────────────────────────
const reviewEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only users who booked this event can review
    const booking = await Booking.findOne({
      user: req.user._id,
      event: eventId,
      status: { $in: ['confirmed', 'cancelled'] }, // confirmed (attended) or cancelled (still participated)
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: 'You can only review events you have booked',
      });
    }

    // Prevent review before event date
    if (new Date(event.date) > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'You can only review events that have already taken place',
      });
    }

    const review = await Review.create({
      user: req.user._id,
      event: eventId,
      rating: Number(rating),
      comment,
      booking: booking._id,
    });

    await updateAverageRating('event', eventId);

    await review.populate('user', 'name profileImage');

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this event',
      });
    }
    next(error);
  }
};

// ─── @POST /api/reviews/artist/:artistId ──────────────────────────────────────
const reviewArtist = async (req, res, next) => {
  try {
    const { artistId } = req.params;
    const { rating, comment } = req.body;

    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    // Check user has attended at least one of this artist's events
    const Event = require('../models/Event');
    const artistEvents = await Event.find({ artist: artistId }).select('_id');
    const artistEventIds = artistEvents.map((e) => e._id);

    const booking = await Booking.findOne({
      user: req.user._id,
      event: { $in: artistEventIds },
      status: 'confirmed',
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: 'You can only review artists whose events you have attended',
      });
    }

    const review = await Review.create({
      user: req.user._id,
      artist: artistId,
      rating: Number(rating),
      comment,
    });

    await updateAverageRating('artist', artistId);
    await review.populate('user', 'name profileImage');

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this artist',
      });
    }
    next(error);
  }
};

// ─── @GET /api/reviews/event/:eventId ─────────────────────────────────────────
const getEventReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { event: req.params.eventId, isVisible: true };
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profileImage');

    res.status(200).json({ success: true, count: reviews.length, total, page, reviews });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/reviews/artist/:artistId ───────────────────────────────────────
const getArtistReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { artist: req.params.artistId, isVisible: true };
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profileImage');

    res.status(200).json({ success: true, count: reviews.length, total, page, reviews });
  } catch (error) {
    next(error);
  }
};

// ─── @DELETE /api/reviews/:id ──────────────────────────────────────────────────
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (
      req.user.role !== 'admin' &&
      review.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const targetType = review.event ? 'event' : 'artist';
    const targetId = review.event || review.artist;

    await Review.findByIdAndDelete(req.params.id);
    await updateAverageRating(targetType, targetId);

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  reviewEvent,
  reviewArtist,
  getEventReviews,
  getArtistReviews,
  deleteReview,
};