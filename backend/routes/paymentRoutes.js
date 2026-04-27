// Location: D:\ConcertHub\backend\routes\paymentRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const {
  getMyPayments,
  getPaymentById,
  getAllPayments,
  adminTopUp,
} = require('../controllers/paymentController');

// GET  /api/payments/my          (any logged-in user)
router.get('/my', protect, getMyPayments);

// GET  /api/payments             (admin only)
router.get('/', protect, authorize('admin'), getAllPayments);

// POST /api/payments/topup       (admin only)
router.post(
  '/topup',
  protect,
  authorize('admin'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  ],
  validate,
  adminTopUp
);

// GET  /api/payments/:id         (owner or admin)
router.get('/:id', protect, getPaymentById);

module.exports = router;