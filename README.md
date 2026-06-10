# 🎵 ConcertHub
## Discover. Book. Experience.

![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![MERN](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Mongoose](https://img.shields.io/badge/ODM-Mongoose-880000?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

<p align="center">
  <strong>A full-stack concert discovery, booking, and artist management platform.</strong>
  <br>
  Built with MongoDB Atlas, Express.js, React, and Node.js.
</p>

<br>

<p align="center">
  <a href="https://concerthub-delta.vercel.app">
    <img
      src="https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20ConcertHub-6f42c1?style=for-the-badge"
      alt="Live Demo"
      height="42"
    />
  </a>
</p>

---

# 📖 Overview

ConcertHub is a modern multi-role event management platform that connects:

- 🎟️ Concert Fans
- 🎤 Performing Artists
- 🛡️ Platform Administrators

Users can discover events, purchase tickets using a wallet-based payment system, follow artists, leave reviews, and manage bookings.

Artists can build their public profile, create events, monitor performance analytics, and manage their concert portfolio.

Administrators maintain platform quality through artist verification, event moderation, user management, financial monitoring, and business analytics.

---

# 🎯 Problem Statement

Most event platforms focus only on ticket sales.

ConcertHub focuses on the complete event ecosystem:

- Artist onboarding
- Event approval workflows
- Wallet-based transactions
- Revenue tracking
- Audience engagement
- Administrative governance

The platform demonstrates how complex real-world workflows can be implemented using MongoDB's document model while maintaining data consistency across interconnected collections.

---

# ✨ Key Features

## For Fans

- Browse upcoming concerts
- Discover artists
- Book tickets instantly
- Wallet-based payments
- Booking management
- Ticket cancellation & refunds
- Favorite artists and events
- Review events and artists
- Personal transaction history

## For Artists

- Create professional artist profiles
- Upload profile and banner images
- Create concert events
- Manage event lifecycle
- Track ticket sales
- Monitor earnings
- Revenue analytics dashboard
- Social media integration

## For Administrators

- Approve artist applications
- Moderate event submissions
- Manage platform users
- Monitor bookings
- Track payments
- Review platform activity
- Revenue reporting
- Aggregation-powered analytics

---

# 🏗 System Architecture

```text
React + Vite Frontend
          │
          ▼
REST API (Express.js)
          │
          ▼
Business Logic Layer
          │
          ▼
Mongoose ODM
          │
          ▼
MongoDB Atlas
```

### Request Lifecycle

```text
Client Request
      │
      ▼
JWT Authentication
      │
      ▼
Role Authorization
      │
      ▼
Controller Layer
      │
      ▼
Mongoose Models
      │
      ▼
MongoDB Atlas
      │
      ▼
JSON Response
```

---

# 🗄 Database Design

ConcertHub uses MongoDB Atlas as its primary database and Mongoose as the ODM layer.

The database consists of six interconnected collections:

| Collection | Purpose |
|------------|----------|
| Users | Platform accounts |
| Artists | Artist profiles |
| Events | Concert events |
| Bookings | Ticket reservations |
| Payments | Financial ledger |
| Reviews | Ratings and feedback |

---

## Entity Relationships

```text
User
 │
 ├── 1:1 ── Artist
 │
 ├── 1:M ── Booking
 │
 └── 1:M ── Review

Artist
 │
 └── 1:M ── Event

Event
 │
 ├── 1:M ── Booking
 │
 └── 1:M ── Review

Booking
 │
 └── 1:1 ── Payment
```

All relationships are maintained using MongoDB ObjectId references.

---

# 🧠 Why Referencing Instead of Embedding?

ConcertHub follows a referenced document architecture.

Example:

```js
Booking {
  user: ObjectId,
  event: ObjectId,
  payment: ObjectId
}
```

### Benefits

- Eliminates data duplication
- Maintains consistency
- Simplifies updates
- Reduces document growth
- Enables efficient population using Mongoose

The only embedded structure is the venue object inside Event documents because venue data belongs exclusively to that event.

---

# ⚡ Advanced MongoDB Features

ConcertHub was designed as an Advanced Database Management Systems project and demonstrates multiple advanced database concepts.

## Aggregation Pipelines

Used by the admin dashboard for:

- Revenue calculations
- Ticket statistics
- Booking trends
- Platform KPIs
- Artist rankings

Example operations:

- `$match`
- `$group`
- `$lookup`
- `$sort`
- `$count`
- `$limit`

---

## Indexing

Implemented indexes include:

### Full-Text Search

```text
Event.title
Event.tags
Venue.city
```

Enables fast event discovery.

### Compound Indexes

Used for:

- Booking history retrieval
- Review uniqueness validation

### Unique Constraints

Guarantees:

- Unique emails
- Unique booking identifiers
- Single review per user per event

---

## Mongoose Middleware

Pre-save hooks automatically:

### User

- Hash passwords using bcrypt

### Event

- Generate human-readable event IDs

### Booking

- Generate booking IDs
- Generate ticket codes

### Payment

- Generate transaction identifiers

---

# 💳 Wallet & Payment System

Every new user receives:

```text
$1000 Initial Balance
```

Booking Flow:

```text
User Books Ticket
        │
        ▼
Wallet Balance Check
        │
        ▼
Booking Created
        │
        ▼
Payment Recorded
        │
        ▼
Seats Updated
        │
        ▼
Artist Earnings Updated
```

Every financial action creates a permanent payment record:

- Payment
- Refund
- Top-up

The system maintains:

- Before balance snapshot
- After balance snapshot
- Transaction metadata
- Audit trail

---

# 🔒 Security

ConcertHub implements multiple security layers.

### Authentication

- JWT Authentication
- Protected Routes

### Password Security

- bcrypt hashing
- 10 salt rounds

### Authorization

Role-based access control:

```text
User
Artist
Admin
```

### Validation

- Schema validation
- Input sanitization
- File type restrictions

---

# 🚀 Technology Stack

## Frontend

- React 18
- Vite
- React Router
- Zustand
- Axios
- CSS Modules

## Backend

- Node.js
- Express.js
- JWT
- bcryptjs
- Multer

## Database

- MongoDB Atlas
- Mongoose
- MongoDB Compass

---

# 📦 Installation

## Clone Repository

```bash
git clone https://github.com/qasimio/ConcertHub.git

cd ConcertHub
```

---

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 🧪 Seed Demo Data

```bash
node services/seeder.js
```

Creates:

- Admin account
- Sample artists
- Sample users
- Sample events

---

# 🎓 Academic Highlights

ConcertHub demonstrates:

- NoSQL Database Design
- Schema Validation
- ObjectId Referencing
- Aggregation Pipelines
- Compound Indexes
- Full-Text Search
- Middleware Hooks
- Authentication & Authorization
- Multi-Role Access Control
- Financial Transaction Tracking

Making it a complete Advanced Database Management Systems (ADBMS) case study.

---

# 👥 Engineering Team

| Name | Role | Contributions |
|--------|--------|--------|
| Qasim Sethar | Lead Architect & Full Stack Engineer | System architecture, backend development, database design, authentication, wallet system, booking engine, deployment |
| Manahil Fatima | Frontend Engineer | UI implementation, React components, responsive layouts, user experience |
| Yumna Ahmed | Database Engineer | MongoDB schema design, collection relationships, indexing strategy, aggregation pipelines, database documentation |

---

# 👨‍💻 Author

### Qasim Sethar
Lead Architect & Project Lead

- GitHub: https://github.com/qasimio
- Portfolio: https://qasimio.me

### Manahil Fatima
Frontend Engineer

### Yumna Ahmed
Database Engineer

---

## Built By

ConcertHub was developed as a collaborative university project by:

- Muhammad Qasim Sethar — Lead Architect & Full Stack Engineer
- Manahil Fatima — Frontend Engineer
- Yumna Ahmed — Database Engineer