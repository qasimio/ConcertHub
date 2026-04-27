// Location: D:\ConcertHub\backend\services\seeder.js
// Usage: node services/seeder.js         → seed DB
//        node services/seeder.js --clear → wipe all collections

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Artist = require('../models/Artist');
const Event = require('../models/Event');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  if (process.argv.includes('--clear')) {
    await Promise.all([
      User.deleteMany(),
      Artist.deleteMany(),
      Event.deleteMany(),
    ]);
    console.log('🗑️  All collections cleared');
    process.exit(0);
  }

  console.log('🌱 Seeding database...');

  // ── Create Admin ────────────────────────────────────────────────────────────
  const adminExists = await User.findOne({ email: 'admin@concerthub.com' });
  let admin;
  if (!adminExists) {
    admin = await User.create({
      name: 'Super Admin',
      email: 'admin@concerthub.com',
      password: 'Admin@123',
      role: 'admin',
      walletBalance: 99999,
    });
    console.log('✅ Admin created: admin@concerthub.com / Admin@123');
  } else {
    admin = adminExists;
    console.log('ℹ️  Admin already exists');
  }

  // ── Create Artist Users ─────────────────────────────────────────────────────
  const artistsData = [
    {
      name: 'Luna Rivera',
      email: 'luna@concerthub.com',
      password: 'Artist@123',
      stageName: 'Luna Rivera',
      bio: 'Indie pop sensation from Los Angeles. Known for dreamy vocals and heartfelt lyrics.',
      genre: ['Indie', 'Pop'],
    },
    {
      name: 'Neon Pulse',
      email: 'neon@concerthub.com',
      password: 'Artist@123',
      stageName: 'Neon Pulse',
      bio: 'Electronic music collective pushing boundaries of sound design.',
      genre: ['Electronic'],
    },
    {
      name: 'Marcus Webb',
      email: 'marcus@concerthub.com',
      password: 'Artist@123',
      stageName: 'Marcus Webb',
      bio: 'Jazz pianist and composer. 3x Grammy nominated.',
      genre: ['Jazz', 'Soul'],
    },
  ];

  const createdArtists = [];
  for (const a of artistsData) {
    let user = await User.findOne({ email: a.email });
    if (!user) {
      user = await User.create({
        name: a.name,
        email: a.email,
        password: a.password,
        role: 'artist',
      });
    }

    let artistProfile = await Artist.findOne({ user: user._id });
    if (!artistProfile) {
      artistProfile = await Artist.create({
        user: user._id,
        stageName: a.stageName,
        bio: a.bio,
        genre: a.genre,
        verificationStatus: 'approved',
      });
    }
    createdArtists.push(artistProfile);
  }
  console.log(`✅ ${createdArtists.length} artists seeded`);

  // ── Create Sample Users ─────────────────────────────────────────────────────
  const usersData = [
    { name: 'Alice Johnson', email: 'alice@example.com', password: 'User@123' },
    { name: 'Bob Smith', email: 'bob@example.com', password: 'User@123' },
  ];

  for (const u of usersData) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create({ ...u, role: 'user', walletBalance: 1000 });
    }
  }
  console.log(`✅ ${usersData.length} sample users seeded`);

  // ── Create Sample Events ────────────────────────────────────────────────────
  const eventsData = [
    {
      title: 'Luna Rivera: Neon Dreams Tour',
      description: 'An intimate evening of indie pop music in the heart of the city.',
      genre: 'Indie',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      venue: { name: 'The Roxy', city: 'Los Angeles', address: '9009 W Sunset Blvd', country: 'USA' },
      price: 45,
      totalSeats: 500,
      status: 'published',
      approvalStatus: 'approved',
      artistIndex: 0,
    },
    {
      title: 'Neon Pulse: Frequency Festival',
      description: 'All-night electronic music extravaganza with state-of-the-art light shows.',
      genre: 'Electronic',
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      venue: { name: 'Exchange LA', city: 'Los Angeles', address: '618 S Spring St', country: 'USA' },
      price: 75,
      totalSeats: 1000,
      status: 'published',
      approvalStatus: 'approved',
      artistIndex: 1,
    },
    {
      title: 'Marcus Webb Jazz Night',
      description: 'An elegant evening of live jazz in an intimate setting.',
      genre: 'Jazz',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      venue: { name: 'Jazz Alley', city: 'Seattle', address: '2033 6th Ave', country: 'USA' },
      price: 60,
      totalSeats: 200,
      status: 'published',
      approvalStatus: 'approved',
      artistIndex: 2,
    },
  ];

  let eventsCreated = 0;
  for (const e of eventsData) {
    const exists = await Event.findOne({ title: e.title });
    if (!exists) {
      const { artistIndex, ...eventData } = e;
      await Event.create({ ...eventData, artist: createdArtists[artistIndex]._id });
      eventsCreated++;
    }
  }
  console.log(`✅ ${eventsCreated} events seeded`);

  console.log('\n🎉 Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Login credentials:');
  console.log('   Admin:   admin@concerthub.com  / Admin@123');
  console.log('   Artist:  luna@concerthub.com   / Artist@123');
  console.log('   User:    alice@example.com     / User@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});