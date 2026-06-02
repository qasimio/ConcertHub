# ConcertHub — Complete Functionality Guide

> A full-stack MERN concert management platform. This document covers every feature, every role, every API route, and every piece of the UI — along with setup, testing, and troubleshooting.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Full File Structure](#3-full-file-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Running the App](#5-running-the-app)
6. [Seeded Test Accounts](#6-seeded-test-accounts)
7. [Roles & Permissions](#7-roles--permissions)
8. [Feature Walkthrough by Role](#8-feature-walkthrough-by-role)
   - [Public (not logged in)](#81-public-not-logged-in)
   - [User (Fan/Attendee)](#82-user-fanattendee)
   - [Artist (Musician)](#83-artist-musician)
   - [Admin](#84-admin)
9. [Wallet & Payment System](#9-wallet--payment-system)
10. [Booking & Cancellation Flow](#10-booking--cancellation-flow)
11. [Approval Workflows](#11-approval-workflows)
12. [Full API Reference](#12-full-api-reference)
13. [Frontend Pages & Routes](#13-frontend-pages--routes)
14. [Environment Variables](#14-environment-variables)
15. [Testing Checklist](#15-testing-checklist)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project Overview

ConcertHub is a mini Eventbrite + Spotify Artist Dashboard hybrid:

- **Fans** discover and book tickets to live concerts
- **Artists** create and manage their own concert listings
- **Admins** control the platform: approving artists, approving events, managing users, and monitoring revenue

**Key design decisions:**
- All payments are wallet-based (no real payment gateway). Every new user receives **$1,000** credit automatically.
- All money transfers use **MongoDB atomic transactions** — if anything fails mid-booking, the entire operation rolls back.
- Artists must be **admin-approved** before they can create events.
- Events must be **admin-approved** before they appear publicly.
- Bookings generate **ticket codes** and a human-readable `BKG-YYYY-NNNNN` ID.

---

## 2. Architecture

```
Browser (React + Vite)
        ↓  HTTP (Axios, /api proxy)
Express.js API (Node.js)
        ↓
MongoDB Atlas (Mongoose ODM)

Flow per request:
  Rate Limiter → CORS → Auth Middleware → Role Guard → Controller → DB → Response
```

**Backend stack:** Express · Mongoose · JWT · bcrypt · Multer · express-validator · Helmet · Morgan

**Frontend stack:** React 18 · React Router v6 · Zustand · Axios · react-hot-toast · date-fns · react-icons

---

## 3. Full File Structure

```
ConcertHub/
├── backend/
│   ├── .env                         ← your secrets (never commit)
│   ├── .env.example
│   ├── package.json
│   ├── server.js                    ← entry point
│   ├── config/
│   │   └── db.js                    ← MongoDB connection
│   ├── models/
│   │   ├── User.js                  ← roles, wallet, favorites
│   │   ├── Artist.js                ← profile, verification, earnings
│   │   ├── Event.js                 ← concerts, seats, approval
│   │   ├── Booking.js               ← ticket purchases
│   │   ├── Payment.js               ← wallet ledger
│   │   └── Review.js                ← ratings + comments
│   ├── middleware/
│   │   ├── auth.js                  ← protect / authorize / optionalAuth
│   │   ├── errorHandler.js          ← global error + 404
│   │   ├── validate.js              ← express-validator runner
│   │   └── upload.js                ← multer image handler
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── artistController.js
│   │   ├── eventController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   ├── reviewController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── artistRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   └── seeder.js                ← dev data seeder
│   └── uploads/                     ← image storage (auto-created)
│
└── frontend/
    ├── .env
    ├── .env.example
    ├── package.json
    ├── vite.config.js               ← API proxy to :5000
    ├── index.html
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx                 ← React entry point
        ├── App.jsx                  ← router + all routes
        ├── index.css                ← design tokens + global styles
        ├── store/
        │   └── authStore.js         ← Zustand auth state
        ├── services/
        │   └── api.js               ← all Axios calls
        ├── utils/
        │   └── helpers.js           ← formatters, constants
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.jsx       ← Navbar + Footer wrapper
        │   │   ├── Navbar.jsx
        │   │   └── Footer.jsx
        │   └── ui/
        │       ├── Button.jsx
        │       ├── EventCard.jsx
        │       └── ProtectedRoute.jsx
        └── pages/
            ├── HomePage.jsx
            ├── EventsPage.jsx
            ├── EventDetailPage.jsx
            ├── ArtistsPage.jsx
            ├── ArtistDetailPage.jsx
            ├── NotFoundPage.jsx
            ├── auth/
            │   ├── LoginPage.jsx
            │   └── RegisterPage.jsx
            ├── user/
            │   ├── ProfilePage.jsx
            │   ├── MyBookingsPage.jsx
            │   └── WalletPage.jsx
            ├── artist/
            │   ├── ArtistDashboardPage.jsx
            │   ├── ArtistProfilePage.jsx
            │   └── EventFormModal.jsx
            └── admin/
                └── AdminDashboardPage.jsx
```

---

## 4. Setup & Installation

### Prerequisites
- Node.js v18+ (LTS recommended — v22+ also works)
- Git
- MongoDB Atlas account (already configured in `.env`)

### Step 1 — Clone the repo
```powershell
cd D:\
git clone https://github.com/qasimio/ConcertHub.git
cd ConcertHub
```

### Step 2 — Backend setup
```powershell
cd backend
npm install
copy .env.example .env
```

Open `.env` and confirm these values are correct:
```env
PORT=5000
MONGODB_URI=mongodb+srv://yumnaahmed030_db_user:table12@concerthub.a40yddz.mongodb.net/?appName=ConcertHub
JWT_SECRET=supersecret123
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NEW_USER_BALANCE=1000
```

### Step 3 — Frontend setup
```powershell
cd ..\frontend
npm install
copy .env.example .env
```

`.env` should contain:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4 — Seed the database
```powershell
cd ..\backend
node services/seeder.js
```

Expected output:
```
✅ MongoDB Connected
✅ Admin created: admin@concerthub.com / Admin@123
✅ 3 artists seeded
✅ 2 sample users seeded
✅ 3 events seeded
🎉 Seeding complete!
```

To wipe and reseed:
```powershell
node services/seeder.js --clear
node services/seeder.js
```

---

## 5. Running the App

Open **two terminals**:

**Terminal 1 — Backend**
```powershell
cd D:\ConcertHub\backend
npm run dev
```
→ `🚀 Server running on port 5000`

**Terminal 2 — Frontend**
```powershell
cd D:\ConcertHub\frontend
npm run dev
```
→ `➜ Local: http://localhost:5173/`

Open `http://localhost:5173` in your browser.

---

## 6. Seeded Test Accounts

| Role   | Email                    | Password    | Notes                              |
|--------|--------------------------|-------------|------------------------------------|
| Admin  | admin@concerthub.com     | Admin@123   | Full platform control              |
| Artist | luna@concerthub.com      | Artist@123  | Luna Rivera — approved artist      |
| Artist | neon@concerthub.com      | Artist@123  | Neon Pulse — approved artist       |
| Artist | marcus@concerthub.com    | Artist@123  | Marcus Webb — approved artist      |
| User   | alice@example.com        | User@123    | $1,000 wallet balance              |
| User   | bob@example.com          | User@123    | $1,000 wallet balance              |

The **Login page** has a dev quick-fill row at the bottom — click Admin / Artist / User to auto-fill credentials.

---

## 7. Roles & Permissions

### `user` — Fan/Attendee
- Browse all public events and artists
- Book tickets (wallet payment)
- Cancel bookings (before deadline)
- Leave reviews on attended events and artists
- Save favorite artists and events
- View wallet balance and transaction history

### `artist` — Musician
- All of the above EXCEPT booking tickets
- Must be approved by admin before creating events
- Create / edit / delete own events
- Upload event banners
- View personal analytics: revenue, tickets sold, monthly trends
- Edit their artist profile (bio, genres, social links, images)

### `admin` — Platform Owner
- View full platform dashboard (KPIs, revenue, top artists/events)
- Approve or reject artist profiles
- Approve or reject event listings
- Toggle user active/inactive
- See all users, bookings, payments
- Top up any user's wallet
- Hard-delete or hide reviews
- Access to all ticket stats per event

---

## 8. Feature Walkthrough by Role

### 8.1 Public (not logged in)

| Page | URL | What you can do |
|------|-----|-----------------|
| Home | `/` | Hero, search, featured events, featured artists, genre filters |
| Events | `/events` | Browse all approved events, filter by genre/city/price, sort |
| Event Detail | `/events/:id` | View full event info, venue, artist, reviews. Clicking "Book" redirects to login |
| Artists | `/artists` | Browse all approved artists, filter by genre |
| Artist Detail | `/artists/:id` | View artist bio, genres, social links, upcoming events, reviews |

### 8.2 User (Fan/Attendee)

#### Registering as a User
1. Go to `/register`
2. Select **🎟️ Fan / Attendee** role
3. Fill name, email, password → Create Account
4. Redirected to `/events` with **$1,000 wallet credit**

#### Booking Tickets
1. Browse to any event at `/events/:id`
2. In the right sidebar: choose ticket count (1–10)
3. Check total cost and wallet balance
4. Click **Book Now**
5. If wallet balance is sufficient → booking confirmed instantly
6. Receive a `BKG-YYYY-NNNNN` booking ID and ticket codes
7. Toast notification with confirmation

#### Viewing Bookings
- Go to `/my-bookings` (Navbar → user menu → My Bookings)
- Filter by: All / Confirmed / Cancelled / Refunded
- Each booking shows: event thumbnail, title, artist, date, venue, ticket count, total price, status

#### Cancelling a Booking
1. Go to `/my-bookings`
2. Click **Cancel** on any confirmed future event
3. Confirm in the browser prompt
4. Full refund returned to wallet immediately
5. Seats restored to the event
- **Restriction:** Cannot cancel within `cancellationDeadlineHours` of event (default 24h)

#### Wallet
- Go to `/wallet`
- See current balance, total spent, total refunded
- Full transaction history with type (payment / refund / top-up)
- Each transaction shows before/after balance

#### Profile
- Go to `/profile`
- Update display name, phone number, profile photo
- Change password (requires current password)

#### Favorites
- On any event detail page: click **Save** button
- On any artist detail page: click **Follow** button
- Saved items appear in your profile

#### Reviews
- Only available after an event's date has passed
- Only users who booked the event can leave a review
- 1–5 star rating + optional comment
- One review per user per event, one per user per artist

### 8.3 Artist (Musician)

#### Registering as an Artist
1. Go to `/register`
2. Select **🎤 Artist** role
3. A blank artist profile is auto-created (pending approval)
4. Redirected to `/artist-dashboard`
5. See a yellow "Profile Under Review" banner

#### Getting Approved
- Admin logs in → goes to `/admin` → Artists tab → clicks Approve
- Once approved, the banner disappears and "New Event" button appears

#### Setting Up Profile
1. Go to `/artist-profile` (Dashboard → Edit Profile button)
2. Upload profile photo and banner image
3. Fill stage name, bio, genres (multi-select)
4. Add social links (Instagram, Twitter, Spotify, YouTube, website)
5. Click **Save Profile**

#### Creating an Event
1. Go to `/artist-dashboard`
2. Click **New Event**
3. Fill in the modal form:
   - Title, genre, description
   - Date & time
   - Ticket price (USD)
   - Total seats
   - Cancellation deadline (hours before event)
   - Venue: name, city, address, country
   - Optional: banner image
4. Click **Create Event** → status: `pending` (admin must approve)

#### Editing / Deleting Events
- From dashboard event list, click the ✏️ pencil icon to edit
- Editing re-sets approval status to `pending`
- Click 🗑️ trash icon to delete
  - If active bookings exist, event is **cancelled** (not deleted) and refunds must be processed manually by admin

#### Analytics Dashboard
Shows on the Artist Dashboard:
- **Tickets Sold** — total across all events
- **Total Revenue** — sum of all confirmed booking payments
- **Total Events** — count of all events (all statuses)
- **Upcoming** — events with future dates
- **Top 5 Events by Revenue** — ranked table
- **Monthly Revenue** — last 6 months

### 8.4 Admin

#### Accessing Admin Panel
- Login as `admin@concerthub.com`
- Go to `/admin` (also in Navbar)
- Four tabs: Overview · Artists · Events · Users

#### Overview Tab
- **KPI cards:** Total Users, Approved Artists, Confirmed Bookings, Net Revenue
- **Alert badge:** Count of pending approvals (pulsing if any)
- **Recent Bookings** — last 5 confirmed bookings
- **Top Artists** — ranked by earnings

#### Artists Tab
- List of all **pending** artist profiles
- Each card shows: avatar, stage name, email, genres, bio snippet
- Actions per artist:
  - ✅ **Approve** — artist immediately gains event creation rights
  - ❌ **Reject** — browser prompt asks for a reason, stored in `rejectionReason`
  - 👁️ **View** — opens artist public page in new tab

#### Events Tab
- List of all **pending** event listings
- Each card shows: banner thumbnail, title, artist, date, city, price, seat count
- Actions per event:
  - ✅ **Approve** — event auto-published and visible publicly
  - ❌ **Reject** — event stays hidden
  - 👁️ **View** — opens event public page in new tab

#### Users Tab
- Table of all non-admin users
- Columns: Name/Email, Role badge, Wallet balance, Join date, Status dot, Action
- **Deactivate** — soft-disables account (user cannot login)
- **Activate** — re-enables account
- Admin accounts cannot be toggled

#### Ticket Stats
- Available via API: `GET /api/admin/ticket-stats`
- Returns: total seats across all events, sold seats, available seats, occupancy rate
- Per-event breakdown with the same stats

---

## 9. Wallet & Payment System

All money is virtual. No real payment gateway is used.

### How it works

```
User registers → wallet seeded with $1,000
User books 2 tickets @ $45 each:
  → $90 deducted from wallet atomically
  → Payment record created (type: "payment", status: "success")
  → walletBalanceBefore: $1000, walletBalanceAfter: $910

User cancels booking:
  → $90 refunded to wallet atomically
  → New Payment record (type: "refund")
  → Booking status: "cancelled"

Admin top-up:
  → POST /api/payments/topup { userId, amount }
  → Payment record (type: "topup")
```

### MongoDB Transaction Safety
The booking + payment + seat decrement all happen inside one Mongoose session transaction. If the wallet check fails (insufficient balance), nothing is written to the DB.

### Balance display
- Navbar shows wallet balance badge (user role only)
- Event detail booking widget shows current balance vs cost
- Turns red if balance < total cost

---

## 10. Booking & Cancellation Flow

### Full booking flow
```
1. User clicks "Book Now" on event detail page
2. Frontend sends POST /api/bookings { eventId, ticketCount }
3. Backend:
   a. Opens MongoDB session + transaction
   b. Validates event (exists, approved, published, future, seats available)
   c. Checks no existing booking by this user for this event
   d. Calculates totalPrice = price × ticketCount
   e. Creates Booking document (status: confirmed)
   f. Deducts from user wallet (fails if insufficient)
   g. Creates Payment document (type: payment)
   h. Links payment to booking
   i. Decrements event.availableSeats
   j. Increments event.totalBookings, event.totalRevenue
   k. Increments artist.totalEarnings, artist.totalTicketsSold
   l. Commits transaction
4. Returns new booking + newWalletBalance
5. Frontend updates wallet display + shows success toast
```

### Full cancellation flow
```
1. User clicks "Cancel" in My Bookings
2. Frontend sends PUT /api/bookings/:id/cancel
3. Backend:
   a. Opens transaction
   b. Validates: booking exists, user owns it, status is confirmed
   c. Checks cancellationDeadlineHours (skipped for admin)
   d. Refunds totalPrice to user wallet
   e. Creates Payment document (type: refund)
   f. Restores event.availableSeats
   g. Decrements event.totalBookings, event.totalRevenue
   h. Decrements artist stats
   i. Sets booking.status = "cancelled"
   j. Commits transaction
4. Returns newWalletBalance
5. Frontend updates wallet + removes cancel button from booking card
```

---

## 11. Approval Workflows

### Artist approval
```
Artist registers (role: artist)
  → Artist profile created (verificationStatus: "pending")
  → Artist dashboard shows yellow "Under Review" banner
  → Cannot create events

Admin approves:
  → verificationStatus: "approved"
  → Artist can now create events
  → "New Event" button appears

Admin rejects:
  → verificationStatus: "rejected"
  → rejectionReason stored
  → Red "Rejected" banner shown with reason
```

### Event approval
```
Artist creates event
  → event.approvalStatus: "pending", event.status: "draft"
  → Not visible on public /events listing
  → Visible on artist's own dashboard

Admin approves:
  → approvalStatus: "approved"
  → status auto-set to "published"
  → Event appears publicly immediately

Admin rejects:
  → approvalStatus: "rejected"
  → Event stays hidden
  → Artist can see rejection on dashboard

Artist edits event:
  → approvalStatus reset to "pending"
  → Admin must re-approve
```

---

## 12. Full API Reference

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user or artist |
| POST | `/auth/login` | ❌ | Login, receive JWT token |
| GET | `/auth/me` | ✅ | Get current user profile |
| PUT | `/auth/update-password` | ✅ | Change password |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | Optional | List events (public: approved+published only) |
| GET | `/events/:id` | Optional | Get single event |
| POST | `/events` | Artist | Create event |
| PUT | `/events/:id` | Artist/Admin | Update event |
| DELETE | `/events/:id` | Artist/Admin | Delete or cancel event |
| PUT | `/events/:id/approve` | Admin | Approve or reject event |

**GET /events query params:**
- `search` — text search
- `genre` — filter by genre
- `city` — filter by venue city
- `minPrice` / `maxPrice` — price range
- `sortBy` — `price_asc` / `price_desc` / `rating` / `newest`
- `page` / `limit` — pagination

### Artists
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/artists` | Optional | List approved artists |
| GET | `/artists/me` | Artist | Get own artist profile |
| PUT | `/artists/me` | Artist | Update own profile (multipart) |
| GET | `/artists/me/analytics` | Artist | Revenue & ticket analytics |
| GET | `/artists/:id` | Optional | Get artist by ID + events |
| PUT | `/artists/:id/approve` | Admin | Approve or reject artist |

### Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bookings` | User | Book tickets |
| GET | `/bookings` | Admin | All platform bookings |
| GET | `/bookings/:id` | Owner/Admin | Get booking detail |
| PUT | `/bookings/:id/cancel` | Owner/Admin | Cancel booking + refund |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✅ | My profile + favorites |
| PUT | `/users/profile` | ✅ | Update profile + photo |
| GET | `/users/wallet` | ✅ | Wallet balance + transactions |
| GET | `/users/bookings` | ✅ | My booking history |
| POST | `/users/favorites/artist/:id` | ✅ | Toggle favorite artist |
| POST | `/users/favorites/event/:id` | ✅ | Toggle favorite event |
| GET | `/users` | Admin | All users |
| GET | `/users/:id` | Admin | User by ID |
| PUT | `/users/:id` | Admin | Update user data |
| DELETE | `/users/:id` | Admin | Soft-delete user |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/my` | ✅ | My payment history |
| GET | `/payments` | Admin | All platform payments |
| POST | `/payments/topup` | Admin | Top up a user's wallet |
| GET | `/payments/:id` | Owner/Admin | Payment detail |

### Reviews
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reviews/event/:id` | User | Review an event |
| POST | `/reviews/artist/:id` | User | Review an artist |
| GET | `/reviews/event/:id` | ❌ | Event reviews (public) |
| GET | `/reviews/artist/:id` | ❌ | Artist reviews (public) |
| DELETE | `/reviews/:id` | Owner/Admin | Delete review |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | Admin | Full platform dashboard data |
| GET | `/admin/ticket-stats` | Admin | Tickets sold/available per event |
| PUT | `/admin/users/:id/toggle-active` | Admin | Enable/disable user |
| PUT | `/admin/reviews/:id/moderate` | Admin | Hide or delete a review |

---

## 13. Frontend Pages & Routes

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | HomePage | Public | Hero, search, featured events + artists |
| `/events` | EventsPage | Public | Browse all events with filters |
| `/events/:id` | EventDetailPage | Public | Event info + booking widget + reviews |
| `/artists` | ArtistsPage | Public | Browse all artists |
| `/artists/:id` | ArtistDetailPage | Public | Artist profile + events + reviews |
| `/login` | LoginPage | Guest only | Sign in form + dev quick-fill |
| `/register` | RegisterPage | Guest only | Sign up as user or artist |
| `/profile` | ProfilePage | Any auth | Edit name, phone, photo, password |
| `/my-bookings` | MyBookingsPage | User only | Booking history + cancel |
| `/wallet` | WalletPage | User only | Balance, transactions |
| `/artist-dashboard` | ArtistDashboardPage | Artist only | Stats, events, analytics |
| `/artist-profile` | ArtistProfilePage | Artist only | Edit bio, images, genres, socials |
| `/admin` | AdminDashboardPage | Admin only | Full platform control |
| `*` | NotFoundPage | Public | 404 with concert-themed message |

---

## 14. Environment Variables

### Backend (`backend/.env`)
| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `5000` | API server port |
| `MONGODB_URI` | `mongodb+srv://...` | Atlas connection string |
| `JWT_SECRET` | `supersecret123` | Change in production! |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | For CORS whitelist |
| `NEW_USER_BALANCE` | `1000` | Starting wallet for new users |

### Frontend (`frontend/.env`)
| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `http://localhost:5000/api` | Proxied in dev via vite.config.js |

---

## 15. Testing Checklist

Work through this list top to bottom to verify every feature works:

### Public flows
- [ ] Homepage loads with events and artists
- [ ] Genre pill filters navigate to `/events?genre=X`
- [ ] Search bar on homepage navigates to events with query
- [ ] Events page loads, filters work (genre, city, price, sort)
- [ ] Clicking an event card opens event detail
- [ ] Event detail shows booking widget with "Sign In to Book"
- [ ] Artists page loads all approved artists
- [ ] Artist detail shows bio, genres, events, reviews

### Auth flows
- [ ] Register as User — receives $1,000 wallet
- [ ] Register as Artist — sees "Under Review" banner
- [ ] Login as each role redirects to correct page
- [ ] Invalid login shows error toast
- [ ] Navbar updates correctly after login (wallet badge for users)
- [ ] Logout clears token and redirects to home

### User flows
- [ ] Book 2 tickets to an event
- [ ] Wallet balance deducted correctly
- [ ] Booking appears in My Bookings with `confirmed` status
- [ ] Cancel a booking — full refund to wallet
- [ ] Cancelled booking shows `cancelled` status
- [ ] Wallet page shows all transactions
- [ ] Save/unsave a favorite event
- [ ] Follow/unfollow an artist

### Artist flows
- [ ] Login as Luna (`luna@concerthub.com`)
- [ ] Dashboard shows stats and event list
- [ ] Edit Profile — update bio and genres — save works
- [ ] Upload profile and banner images
- [ ] Create a new event — appears as `pending`
- [ ] Edit an event — re-triggers pending state
- [ ] Analytics tab shows revenue and tickets

### Admin flows
- [ ] Login as admin (`admin@concerthub.com`)
- [ ] Dashboard KPIs show correct numbers
- [ ] Artists tab shows pending artists
- [ ] Approve Luna Rivera → yellow banner disappears on her dashboard
- [ ] Events tab shows pending events
- [ ] Approve an event → it appears publicly on `/events`
- [ ] Reject an event with a reason
- [ ] Users tab shows all users with correct roles/balances
- [ ] Deactivate a user → they cannot login
- [ ] Activate a user → they can login again

### Edge cases
- [ ] Try booking with insufficient wallet balance → shows "Insufficient Balance"
- [ ] Try booking a sold-out event → "Sold Out" button state
- [ ] Try booking a past event → "Event Ended" button state
- [ ] Try navigating to `/admin` as a user → redirected to home
- [ ] Try navigating to `/artist-dashboard` as a user → redirected to home
- [ ] 404 page appears for unknown routes

---

## 16. Troubleshooting

### "Cannot connect to MongoDB"
- Check your Atlas cluster is running and the IP whitelist includes `0.0.0.0/0`
- Verify `MONGODB_URI` in `backend/.env` is correct
- Run `node services/seeder.js` and check for MongoDB errors

### "Port 5000 already in use"
```powershell
# Windows — find and kill the process
netstat -ano | findstr :5000
taskkill /PID <pid> /F
```

### "CORS error in browser console"
- Confirm `CLIENT_URL=http://localhost:5173` in `backend/.env`
- Confirm frontend is running on port 5173 (check vite.config.js)
- Restart the backend after changing `.env`

### "Token invalid / expired"
- Clear localStorage in DevTools → Application → Local Storage → delete `ch_token` and `ch_user`
- Login again

### Images not loading
- The `uploads/` folder must exist in `backend/` (auto-created on first upload)
- The Vite proxy forwards `/uploads` to the backend — confirm `vite.config.js` has the `/uploads` proxy rule

### Booking fails with "Insufficient balance"
- The logged-in user's wallet is below the ticket cost
- Admin can top up: `POST /api/payments/topup` with `{ userId, amount }`
- Or use the admin UI → Users tab (wallet column shows current balance)

### Seeder fails
```powershell
node services/seeder.js --clear  # wipe first
node services/seeder.js          # re-seed
```

### Frontend build errors
```powershell
cd frontend
npm run build  # check error output
```

Common causes: missing import, typo in component name, CSS module class that doesn't exist.

### Artist can't create events after approval
- Confirm `verificationStatus === "approved"` in MongoDB Atlas for that artist document
- Try refreshing the artist dashboard (token rehydrate may be needed)
- Check browser console for API errors

---

## Quick Reference — Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open DevTools | F12 |
| Clear site data (full logout) | DevTools → Application → Clear site data |
| Hard refresh (skip cache) | Ctrl + Shift + R |

---

*ConcertHub v1.0 — Built with ♪ by Qasim*