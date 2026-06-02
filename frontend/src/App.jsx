// Location: ConcertHub/frontend/src/App.jsx
import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ui/ProtectedRoute';

// ── Pages (lazy-loaded for performance) ───────────────────────────────────────
const HomePage          = lazy(() => import('./pages/HomePage'));
const EventsPage        = lazy(() => import('./pages/EventsPage'));
const EventDetailPage   = lazy(() => import('./pages/EventDetailPage'));
const ArtistsPage       = lazy(() => import('./pages/ArtistsPage'));
const ArtistDetailPage  = lazy(() => import('./pages/ArtistDetailPage'));
const LoginPage         = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage      = lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage       = lazy(() => import('./pages/user/ProfilePage'));
const MyBookingsPage    = lazy(() => import('./pages/user/MyBookingsPage'));
const WalletPage        = lazy(() => import('./pages/user/WalletPage'));
const ArtistDashboard   = lazy(() => import('./pages/artist/ArtistDashboardPage'));
const ArtistProfile     = lazy(() => import('./pages/artist/ArtistProfilePage'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboardPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));

// ── Page loader ────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 16,
  }}>
    <div style={{
      width: 40, height: 40,
      border: '3px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
    <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
      Loading…
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── App ────────────────────────────────────────────────────────────────────────
const App = () => {
  const { refreshUser, token } = useAuthStore();

  // Rehydrate user from token on first load
  useEffect(() => {
    if (token) refreshUser();
  }, []);

  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: { primary: 'var(--accent)', secondary: 'var(--text-inverse)' },
          },
          error: {
            iconTheme: { primary: 'var(--danger)', secondary: 'white' },
          },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public routes (with Navbar + Footer) ─────────────────────────── */}
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="artists" element={<ArtistsPage />} />
            <Route path="artists/:id" element={<ArtistDetailPage />} />

            {/* ── User routes ─────────────────────────────────────────────────── */}
            <Route
              path="profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
              path="my-bookings"
              element={<ProtectedRoute role="user"><MyBookingsPage /></ProtectedRoute>}
            />
            <Route
              path="wallet"
              element={<ProtectedRoute role="user"><WalletPage /></ProtectedRoute>}
            />

            {/* ── Artist routes ────────────────────────────────────────────────── */}
            <Route
              path="artist-dashboard"
              element={<ProtectedRoute role="artist"><ArtistDashboard /></ProtectedRoute>}
            />
            <Route
              path="artist-profile"
              element={<ProtectedRoute role="artist"><ArtistProfile /></ProtectedRoute>}
            />

            {/* ── Admin routes ─────────────────────────────────────────────────── */}
            <Route
              path="admin"
              element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>}
            />

            {/* ── 404 ──────────────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* ── Auth routes (no Navbar/Footer) ───────────────────────────────── */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;