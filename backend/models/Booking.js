// Location: D:\ConcertHub\backend\models\Booking.js

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // Readable booking ID
    booking_id: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketCount: {
      type: Number,
      required: [true, 'Ticket count is required'],
      min: [1, 'Must book at least 1 ticket'],
      max: [10, 'Cannot book more than 10 tickets at once'],
    },
    pricePerTicket: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'refunded', 'pending'],
      default: 'confirmed',
    },
    // Cancellation
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    // Refund reference
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    // Ticket codes (one per ticket)
    ticketCodes: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Auto-generate booking_id
bookingSchema.pre('save', async function (next) {
  if (this.isNew && !this.booking_id) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Booking').countDocuments();
    this.booking_id = `BKG-${year}-${String(count + 1).padStart(5, '0')}`;
    // Generate simple ticket codes
    this.ticketCodes = Array.from({ length: this.ticketCount }, (_, i) =>
      `TKT-${Date.now()}-${i + 1}`
    );
  }
  next();
});

// Indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ event: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);