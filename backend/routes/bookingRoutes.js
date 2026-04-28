const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createBooking,
  getBookingById,
  cancelBooking,
  getAllBookings,
} = require('../controllers/bookingController');

// POST /api/bookings             (user only)
router.post(
  '/',
  protect,
  authorize('user'),
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('ticketCount')
      .isInt({ min: 1, max: 10 })
      .withMessage('Ticket count must be between 1 and 10'),
  ],
  validate,
  createBooking
);

// GET  /api/bookings             (admin only)
router.get('/', protect, authorize('admin'), getAllBookings);

// GET  /api/bookings/:id         (booking owner or admin)
router.get('/:id', protect, getBookingById);

// PUT  /api/bookings/:id/cancel  (booking owner or admin)
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;