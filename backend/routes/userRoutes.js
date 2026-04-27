// Location: D:\ConcertHub\backend\routes\userRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  getProfile,
  updateProfile,
  getWallet,
  toggleFavoriteArtist,
  toggleFavoriteEvent,
  getMyBookings,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// ── Self-service (any logged-in user) ─────────────────────────────────────────

// GET  /api/users/profile
router.get('/profile', protect, getProfile);

// PUT  /api/users/profile
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

// GET  /api/users/wallet
router.get('/wallet', protect, getWallet);

// GET  /api/users/bookings
router.get('/bookings', protect, getMyBookings);

// POST /api/users/favorites/artist/:artistId
router.post('/favorites/artist/:artistId', protect, toggleFavoriteArtist);

// POST /api/users/favorites/event/:eventId
router.post('/favorites/event/:eventId', protect, toggleFavoriteEvent);

// ── Admin-only ────────────────────────────────────────────────────────────────

// GET  /api/users            (admin)
router.get('/', protect, authorize('admin'), getAllUsers);

// GET  /api/users/:id        (admin)
router.get('/:id', protect, authorize('admin'), getUserById);

// PUT  /api/users/:id        (admin)
router.put('/:id', protect, authorize('admin'), updateUser);

// DELETE /api/users/:id      (admin — soft delete)
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;