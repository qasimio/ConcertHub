// Location: D:\ConcertHub\backend\controllers\userController.js

const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Artist = require('../models/Artist');
const Event = require('../models/Event');

// ─── @GET /api/users/profile ───────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favoriteArtists', 'stageName profileImage genre verificationStatus')
      .populate('favoriteEvents', 'title date venue price status bannerImage');

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/users/profile ───────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (req.file) updateData.profileImage = `/uploads/users/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/users/wallet ────────────────────────────────────────────────────
const getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance name email');

    const transactions = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('booking', 'booking_id');

    res.status(200).json({
      success: true,
      walletBalance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/users/favorites/artist/:artistId ──────────────────────────────
const toggleFavoriteArtist = async (req, res, next) => {
  try {
    const { artistId } = req.params;
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    const user = await User.findById(req.user._id);
    const isFav = user.favoriteArtists.includes(artistId);

    if (isFav) {
      user.favoriteArtists.pull(artistId);
    } else {
      user.favoriteArtists.push(artistId);
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: isFav ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: !isFav,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/users/favorites/event/:eventId ────────────────────────────────
const toggleFavoriteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const user = await User.findById(req.user._id);
    const isFav = user.favoriteEvents.includes(eventId);

    if (isFav) {
      user.favoriteEvents.pull(eventId);
    } else {
      user.favoriteEvents.push(eventId);
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: isFav ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: !isFav,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/users/bookings ──────────────────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'event',
        select: 'title date venue price bannerImage status artist',
        populate: { path: 'artist', select: 'stageName profileImage' },
      });

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @GET /api/users ────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @GET /api/users/:id ────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @PUT /api/users/:id ────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, walletBalance } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (walletBalance !== undefined) updateData.walletBalance = walletBalance;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: @DELETE /api/users/:id ────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Soft delete
    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};