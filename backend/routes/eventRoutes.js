// Location: D:\ConcertHub\backend\routes\eventRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
} = require('../controllers/eventController');

// GET  /api/events               (public + filtered by role)
router.get('/', optionalAuth, getAllEvents);

// GET  /api/events/:id           (public)
router.get('/:id', optionalAuth, getEventById);

// POST /api/events               (artist only)
router.post(
  '/',
  protect,
  authorize('artist'),
  upload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be a positive integer'),
    body('venue.name').notEmpty().withMessage('Venue name is required'),
    body('venue.city').notEmpty().withMessage('City is required'),
  ],
  validate,
  createEvent
);

// PUT  /api/events/:id           (artist owner or admin)
router.put(
  '/:id',
  protect,
  authorize('artist', 'admin'),
  upload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  updateEvent
);

// DELETE /api/events/:id         (artist owner or admin)
router.delete('/:id', protect, authorize('artist', 'admin'), deleteEvent);

// PUT  /api/events/:id/approve   (admin only)
router.put(
  '/:id/approve',
  protect,
  authorize('admin'),
  [
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  ],
  validate,
  approveEvent
);

module.exports = router;