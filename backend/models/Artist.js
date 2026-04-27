// Location: D:\ConcertHub\backend\models\Artist.js

const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    // Linked to User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    stageName: {
      type: String,
      required: [true, 'Stage name is required'],
      trim: true,
      maxlength: [80, 'Stage name cannot exceed 80 characters'],
    },
    bio: {
      type: String,
      maxlength: [2000, 'Bio cannot exceed 2000 characters'],
      default: '',
    },
    genre: {
      type: [String],
      enum: [
        'Pop',
        'Rock',
        'Hip-Hop',
        'R&B',
        'Jazz',
        'Classical',
        'Electronic',
        'Country',
        'Folk',
        'Metal',
        'Indie',
        'Soul',
        'Reggae',
        'Blues',
        'Latin',
        'Other',
      ],
      required: [true, 'At least one genre is required'],
    },
    // Social links
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      spotify: { type: String, default: '' },
      youtube: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    // Profile / banner images (stored as paths)
    profileImage: {
      type: String,
      default: '',
    },
    bannerImage: {
      type: String,
      default: '',
    },
    // Admin controls the verification status
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    // Aggregated stats (updated on booking)
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalTicketsSold: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: get all events for this artist
artistSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'artist',
});

module.exports = mongoose.model('Artist', artistSchema);