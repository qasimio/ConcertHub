// Location: D:\ConcertHub\backend\models\Review.js

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // A review is for either an event OR an artist (not both)
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
    // Only users who attended can review (linked booking)
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per event, and one per user per artist
reviewSchema.index({ user: 1, event: 1 }, { unique: true, sparse: true });
reviewSchema.index({ user: 1, artist: 1 }, { unique: true, sparse: true });
reviewSchema.index({ event: 1 });
reviewSchema.index({ artist: 1 });

module.exports = mongoose.model('Review', reviewSchema);