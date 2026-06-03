// Location: ConcertHub/frontend/src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://concerthub-api.vercel.app/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ch_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ch_token');
      localStorage.removeItem('ch_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// ── Events ────────────────────────────────────────────────────────────────
export const eventAPI = {
  getAll:   (params) => api.get('/events', { params }),
  getById:  (id)     => api.get(`/events/${id}`),
  create:   (data)   => api.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:   (id, data) => api.put(`/events/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:   (id)     => api.delete(`/events/${id}`),
  approve:  (id, data) => api.put(`/events/${id}/approve`, data),
};

// ── Artists ───────────────────────────────────────────────────────────────
export const artistAPI = {
  getAll:       (params) => api.get('/artists', { params }),
  getById:      (id)     => api.get(`/artists/${id}`),
  getMe:        ()       => api.get('/artists/me'),
  updateMe:     (data)   => api.put('/artists/me', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAnalytics: ()       => api.get('/artists/me/analytics'),
  approve:      (id, data) => api.put(`/artists/${id}/approve`, data),
};

// ── Bookings ──────────────────────────────────────────────────────────────
export const bookingAPI = {
  create:   (data) => api.post('/bookings', data),
  getAll:   (params) => api.get('/bookings', { params }),
  getById:  (id)   => api.get(`/bookings/${id}`),
  cancel:   (id, data) => api.put(`/bookings/${id}/cancel`, data),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile:     ()         => api.get('/users/profile'),
  updateProfile:  (data)     => api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getWallet:      ()         => api.get('/users/wallet'),
  getMyBookings:  (params)   => api.get('/users/bookings', { params }),
  favArtist:      (id)       => api.post(`/users/favorites/artist/${id}`),
  favEvent:       (id)       => api.post(`/users/favorites/event/${id}`),
  getAll:         (params)   => api.get('/users', { params }),
  getById:        (id)       => api.get(`/users/${id}`),
  update:         (id, data) => api.put(`/users/${id}`, data),
  delete:         (id)       => api.delete(`/users/${id}`),
};

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentAPI = {
  getMy:    (params) => api.get('/payments/my', { params }),
  getAll:   (params) => api.get('/payments', { params }),
  getById:  (id)     => api.get(`/payments/${id}`),
  topup:    (data)   => api.post('/payments/topup', data),
};

// ── Reviews ───────────────────────────────────────────────────────────────
export const reviewAPI = {
  reviewEvent:  (id, data) => api.post(`/reviews/event/${id}`, data),
  reviewArtist: (id, data) => api.post(`/reviews/artist/${id}`, data),
  getEventReviews:  (id, params) => api.get(`/reviews/event/${id}`, { params }),
  getArtistReviews: (id, params) => api.get(`/reviews/artist/${id}`, { params }),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:   () => api.get('/admin/dashboard'),
  getTicketStats: () => api.get('/admin/ticket-stats'),
  toggleUser:     (id) => api.put(`/admin/users/${id}/toggle-active`),
  moderateReview: (id, data) => api.put(`/admin/reviews/${id}/moderate`, data),
};

export default api;