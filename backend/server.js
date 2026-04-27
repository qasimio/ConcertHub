// Location: D:\ConcertHub\backend\server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const artistRoutes = require('./routes/artistRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ── Connect to DB ─────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow image serving
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter for auth
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger (dev only) ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Static File Serving (uploaded images) ────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🎤 ConcertHub API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// ── API Route Map (dev helper) ────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🎤 ConcertHub API v1.0',
    routes: {
      auth: {
        'POST /api/auth/register': 'Register (user/artist)',
        'POST /api/auth/login': 'Login',
        'GET  /api/auth/me': 'Get current user [protected]',
        'PUT  /api/auth/update-password': 'Change password [protected]',
      },
      users: {
        'GET  /api/users/profile': 'My profile [protected]',
        'PUT  /api/users/profile': 'Update profile [protected]',
        'GET  /api/users/wallet': 'My wallet & transactions [protected]',
        'GET  /api/users/bookings': 'My bookings [protected]',
        'POST /api/users/favorites/artist/:id': 'Toggle favorite artist [protected]',
        'POST /api/users/favorites/event/:id': 'Toggle favorite event [protected]',
        'GET  /api/users': 'All users [admin]',
        'GET  /api/users/:id': 'User by ID [admin]',
        'PUT  /api/users/:id': 'Update user [admin]',
        'DELETE /api/users/:id': 'Deactivate user [admin]',
      },
      artists: {
        'GET  /api/artists': 'All approved artists [public]',
        'GET  /api/artists/me': 'My artist profile [artist]',
        'PUT  /api/artists/me': 'Update my profile [artist]',
        'GET  /api/artists/me/analytics': 'My analytics [artist]',
        'GET  /api/artists/:id': 'Artist by ID [public]',
        'PUT  /api/artists/:id/approve': 'Approve/reject artist [admin]',
      },
      events: {
        'GET  /api/events': 'All published events [public]',
        'GET  /api/events/:id': 'Event by ID [public]',
        'POST /api/events': 'Create event [artist]',
        'PUT  /api/events/:id': 'Update event [artist/admin]',
        'DELETE /api/events/:id': 'Delete event [artist/admin]',
        'PUT  /api/events/:id/approve': 'Approve/reject event [admin]',
      },
      bookings: {
        'POST /api/bookings': 'Book tickets [user]',
        'GET  /api/bookings': 'All bookings [admin]',
        'GET  /api/bookings/:id': 'Booking by ID [owner/admin]',
        'PUT  /api/bookings/:id/cancel': 'Cancel booking [owner/admin]',
      },
      payments: {
        'GET  /api/payments/my': 'My payment history [protected]',
        'GET  /api/payments': 'All payments [admin]',
        'POST /api/payments/topup': 'Top up wallet [admin]',
        'GET  /api/payments/:id': 'Payment by ID [owner/admin]',
      },
      reviews: {
        'POST /api/reviews/event/:id': 'Review an event [user]',
        'POST /api/reviews/artist/:id': 'Review an artist [user]',
        'GET  /api/reviews/event/:id': 'Event reviews [public]',
        'GET  /api/reviews/artist/:id': 'Artist reviews [public]',
        'DELETE /api/reviews/:id': 'Delete review [owner/admin]',
      },
      admin: {
        'GET  /api/admin/dashboard': 'Platform dashboard [admin]',
        'GET  /api/admin/ticket-stats': 'Ticket stats [admin]',
        'PUT  /api/admin/users/:id/toggle-active': 'Toggle user active [admin]',
        'PUT  /api/admin/reviews/:id/moderate': 'Hide/delete review [admin]',
      },
    },
  });
});

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎤 ConcertHub Backend`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📖 API docs: http://localhost:${PORT}/api`);
  console.log(`💚 Health:   http://localhost:${PORT}/api/health`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});