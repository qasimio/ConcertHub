// Location: D:\ConcertHub\backend\routes\adminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getDashboard,
  getTicketStats,
  toggleUserActive,
  moderateReview,
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// GET  /api/admin/dashboard
router.get('/dashboard', getDashboard);

// GET  /api/admin/ticket-stats
router.get('/ticket-stats', getTicketStats);

// PUT  /api/admin/users/:id/toggle-active
router.put('/users/:id/toggle-active', toggleUserActive);

// PUT  /api/admin/reviews/:id/moderate
router.put('/reviews/:id/moderate', moderateReview);

module.exports = router;