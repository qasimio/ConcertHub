// Location: ConcertHub/frontend/src/store/authStore.js

import { create } from 'zustand';
import { authAPI } from '../services/api';

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('ch_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('ch_token') || null,
  loading: false,
  initialized: false,

  setAuth: (user, token) => {
    localStorage.setItem('ch_token', token);
    localStorage.setItem('ch_user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('ch_token');
    localStorage.removeItem('ch_user');
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) { set({ initialized: true }); return; }
    try {
      set({ loading: true });
      const res = await authAPI.getMe();
      const user = res.data.user;
      localStorage.setItem('ch_user', JSON.stringify(user));
      set({ user, initialized: true });
    } catch {
      get().logout();
      set({ initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    localStorage.setItem('ch_user', JSON.stringify(updated));
    set({ user: updated });
  },

  isLoggedIn:  () => !!get().token,
  isAdmin:     () => get().user?.role === 'admin',
  isArtist:    () => get().user?.role === 'artist',
  isUser:      () => get().user?.role === 'user',
}));

export default useAuthStore;