// services/api.js
// ---------------
// Purpose: Centralised Axios instance shared by all service files.
//
// Base URL: http://localhost:3000/api
//   Every relative path used in service files is resolved against this base,
//   so authService calls "/auth/login" → http://localhost:3000/api/auth/login,
//   and so on.
//
// Request interceptor – attaches the Authorization header:
//   After login the backend returns a session token.
//   The token is stored in localStorage under the key 'travelz_auth'.
//   Before every outgoing request this interceptor reads that token and adds
//   the header:  Authorization: Bearer <token>
//   Protected backend routes (authMiddleware) use this header to identify the user.
//
// Response interceptor – normalises error messages:
//   Extracts the human-readable message from the backend's error shape
//   { success, data, error: { message } } so every catch block in service
//   files receives a plain Error with a clean message string.
//
// Separation of concerns:
//   No business logic lives here – only HTTP transport configuration.

import axios from 'axios';

// All API calls target http://localhost:3000/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ---------------------------------------------------------------------------
// Request interceptor – attach Bearer token to every request
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // Auth tokens live in sessionStorage (per-tab) so different users
    // can be logged in simultaneously across different tabs/browsers.
    const raw = sessionStorage.getItem('travelz_auth');
    if (raw) {
      try {
        const { token } = JSON.parse(raw);
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        // Corrupted value – ignore and send without token
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor – normalise error messages
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
