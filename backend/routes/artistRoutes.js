// Location: D:\ConcertHub\backend\routes\artistRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  getAllArtists,
  getArtistById,
  getMyArtistProfile,
  updateMyArtistProfile,
  getMyAnalytics,
  approveArtist,
} = require('../controllers/artistController');

// GET  /api/artists              (public, but passes user for admin filter)
router.get('/', optionalAuth, getAllArtists);

// GET  /api/artists/me           (artist only)
router.get('/me', protect, authorize('artist'), getMyArtistProfile);

// PUT  /api/artists/me           (artist only)
router.put(
  '/me',
  protect,
  authorize('artist'),
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 },
  ]),
  updateMyArtistProfile
);

// GET  /api/artists/me/analytics (artist only)
router.get('/me/analytics', protect, authorize('artist'), getMyAnalytics);

// GET  /api/artists/:id          (public)
router.get('/:id', optionalAuth, getArtistById);

// PUT  /api/artists/:id/approve  (admin only)
router.put('/:id/approve', protect, authorize('admin'), approveArtist);

module.exports = router;