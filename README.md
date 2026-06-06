
```
ConcertHub
├─ .editorconfig
├─ backend
│  ├─ config
│  │  └─ db.js
│  ├─ controllers
│  │  ├─ adminController.js
│  │  ├─ artistController.js
│  │  ├─ authController.js
│  │  ├─ bookingController.js
│  │  ├─ eventController.js
│  │  ├─ paymentController.js
│  │  ├─ reviewController.js
│  │  └─ userController.js
│  ├─ middleware
│  │  ├─ auth.js
│  │  ├─ errorHandler.js
│  │  ├─ upload.js
│  │  └─ validate.js
│  ├─ models
│  │  ├─ Artist.js
│  │  ├─ Booking.js
│  │  ├─ Event.js
│  │  ├─ Payment.js
│  │  ├─ Review.js
│  │  └─ User.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ adminRoutes.js
│  │  ├─ artistRoutes.js
│  │  ├─ authRoutes.js
│  │  ├─ bookingRoutes.js
│  │  ├─ eventRoutes.js
│  │  ├─ paymentRoutes.js
│  │  ├─ reviewRoutes.js
│  │  └─ userRoutes.js
│  ├─ server.js
│  ├─ services
│  │  └─ seeder.js
│  └─ uploads
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  └─ icons.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ hero.png
│  │  │  ├─ react.svg
│  │  │  └─ vite.svg
│  │  ├─ components
│  │  │  ├─ layout
│  │  │  │  ├─ Footer.jsx
│  │  │  │  ├─ Footer.module.css
│  │  │  │  ├─ Layout.jsx
│  │  │  │  ├─ Navbar.jsx
│  │  │  │  └─ Navbar.module.css
│  │  │  └─ ui
│  │  │     ├─ Button.jsx
│  │  │     ├─ Button.module.css
│  │  │     ├─ EventCard.jsx
│  │  │     ├─ EventCard.module.css
│  │  │     └─ ProtectedRoute.jsx
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ admin
│  │  │  │  ├─ AdminDashboardPage.jsx
│  │  │  │  └─ AdminPages.module.css
│  │  │  ├─ artist
│  │  │  │  ├─ ArtistDashboardPage.jsx
│  │  │  │  ├─ ArtistPages.module.css
│  │  │  │  ├─ ArtistProfilePage.jsx
│  │  │  │  └─ EventFormModal.jsx
│  │  │  ├─ ArtistDetailPage.jsx
│  │  │  ├─ ArtistDetailPage.module.css
│  │  │  ├─ ArtistsPage.jsx
│  │  │  ├─ ArtistsPage.module.css
│  │  │  ├─ auth
│  │  │  │  ├─ AuthPage.module.css
│  │  │  │  ├─ LoginPage.jsx
│  │  │  │  └─ RegisterPage.jsx
│  │  │  ├─ EventDetailPage.jsx
│  │  │  ├─ EventDetailPage.module.css
│  │  │  ├─ EventPage.module.css
│  │  │  ├─ EventsPage.jsx
│  │  │  ├─ HomePage.jsx
│  │  │  ├─ HomePage.module.css
│  │  │  ├─ NotFoundPage.jsx
│  │  │  ├─ NotFoundPage.module.css
│  │  │  └─ user
│  │  │     ├─ MyBookingsPage.jsx
│  │  │     ├─ ProfilePage.jsx
│  │  │     ├─ UserPages.module.css
│  │  │     └─ WalletPage.jsx
│  │  ├─ services
│  │  │  └─ api.js
│  │  ├─ store
│  │  │  └─ authStore.js
│  │  └─ utils
│  │     └─ helpers.js
│  └─ vite.config.js
└─ README.md

```
## Database Structure

This project uses MongoDB Atlas as the primary database and Mongoose as the ODM layer.

Collections:
- Users
- Artists
- Events
- Bookings
- Payments
- Reviews

Relationships are maintained using ObjectId references. referencing is used in this database to avoid duplication of data
