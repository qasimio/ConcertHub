// Location: D:\ConcertHub\backend\models\Event.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    // Custom readable event ID (e.g. EVT-2024-001)
    event_id: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
    description: {
      type: String,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
      default: '',
    },
    genre: {
      type: String,
      enum: [
        'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
        'Electronic', 'Country', 'Folk', 'Metal', 'Indie',
        'Soul', 'Reggae', 'Blues', 'Latin', 'Other',
      ],
    },
    // Date & time
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: {
      type: Date,
    },
    // Venue
    venue: {
      name: { type: String, required: [true, 'Venue name is required'] },
      address: { type: String, default: '' },
      city: { type: String, required: [true, 'City is required'] },
      country: { type: String, default: '' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    // Ticketing
    price: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Price cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Must have at least 1 seat'],
    },
    availableSeats: {
      type: Number,
    },
    // Media
    bannerImage: {
      type: String,
      default: '',
    },
    images: [{ type: String }],
    // Status
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
    },
    // Admin approval
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    // Cancellation policy (hours before event)
    cancellationDeadlineHours: {
      type: Number,
      default: 24,
    },
    // Tags for search
    tags: [{ type: String }],
    // Aggregated
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-set availableSeats = totalSeats on create
eventSchema.pre('save', function (next) {
  if (this.isNew) {
    this.availableSeats = this.totalSeats;
  }
  next();
});

// Auto-generate event_id
eventSchema.pre('save', async function (next) {
  if (this.isNew && !this.event_id) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Event').countDocuments();
    this.event_id = `EVT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for search and filtering
eventSchema.index({ title: 'text', 'venue.city': 'text', tags: 'text' });
eventSchema.index({ date: 1 });
eventSchema.index({ price: 1 });
eventSchema.index({ genre: 1 });
eventSchema.index({ approvalStatus: 1, status: 1 });

module.exports = mongoose.model('Event', eventSchema);