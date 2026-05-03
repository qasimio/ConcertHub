// Location: ConcertHub/frontend/src/components/ui/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Wraps a route so only authenticated users (optionally of a specific role) can access it.
 * Usage:
 *   <ProtectedRoute>           — any logged-in user
 *   <ProtectedRoute role="admin">   — admin only
 *   <ProtectedRoute role="artist">  — artist only
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
