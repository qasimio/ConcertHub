// Location: D:\ConcertHub\backend\models\Payment.js

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Readable payment ID
    paymentId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: ['payment', 'refund', 'topup'],
      default: 'payment',
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'refunded'],
      default: 'pending',
    },
    // Wallet snapshot before and after
    walletBalanceBefore: {
      type: Number,
      required: true,
    },
    walletBalanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    // Admin-initiated refund
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
      default: '',
    },
    failureReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate paymentId
paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentId) {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.paymentId = `PAY-${ts}-${rand}`;
  }
  next();
});

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });

module.exports = mongoose.model('Payment', paymentSchema);