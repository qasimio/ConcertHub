// Location: D:\ConcertHub\backend\routes\reviewRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const {
  reviewEvent,
  reviewArtist,
  getEventReviews,
  getArtistReviews,
  deleteReview,
} = require('../controllers/reviewController');

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
];

// POST /api/reviews/event/:eventId     (user only)
router.post('/event/:eventId', protect, authorize('user'), ratingValidation, validate, reviewEvent);

// POST /api/reviews/artist/:artistId   (user only)
router.post('/artist/:artistId', protect, authorize('user'), ratingValidation, validate, reviewArtist);

// GET  /api/reviews/event/:eventId     (public)
router.get('/event/:eventId', getEventReviews);

// GET  /api/reviews/artist/:artistId   (public)
router.get('/artist/:artistId', getArtistReviews);

// DELETE /api/reviews/:id             (review owner or admin)
router.delete('/:id', protect, deleteReview);

module.exports = router;