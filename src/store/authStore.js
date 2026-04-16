import { create } from 'zustand';

const stored = (() => {
  try { return JSON.parse(localStorage.getItem('onup_user')); } catch { return null; }
})();

const useAuthStore = create((set) => ({
  user: stored || null,
  token: localStorage.getItem('onup_token') || null,
  setAuth: (user, token) => {
    localStorage.setItem('onup_token', token);
    localStorage.setItem('onup_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('onup_token');
    localStorage.removeItem('onup_user');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
