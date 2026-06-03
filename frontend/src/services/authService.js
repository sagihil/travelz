// services/authService.js
// -----------------------
// Purpose: Handles all authentication API calls and manages local auth state.
//
// Backend endpoints used:
//   POST /api/auth/login   – Send { email, password }; receive { token, user }.
//   POST /api/auth/logout  – Invalidate the session token on the server.
//   GET  /api/users/me     – Fetch the authenticated user's current profile.
//
// localStorage keys managed:
//   travelz_auth  – { token, userId, isLoggedIn, loginTime }
//   travelz_user  – Full user object (sans password) for immediate reads.
//
// Flow:
//   1. login()        → POST /api/auth/login → store token + user → return user
//   2. (app runs)     → api.js interceptor reads token on each request
//   3. logout()       → POST /api/auth/logout → clear localStorage
//   4. getCurrentUser → GET /api/users/me (uses stored token automatically)

import api from './api.js';

const AUTH_KEY = 'travelz_auth';
const USER_KEY = 'travelz_user';

// ---------------------------------------------------------------------------
// login(email, password)
// Sends credentials to the backend. On success, stores the returned session
// token and user profile in localStorage, then returns the user object.
// Throws an Error with a user-visible message on failure.
// ---------------------------------------------------------------------------
const login = async (email, password) => {
  // POST /api/auth/login
  // Body: { email, password }
  // Response: { success: true, data: { token, user } }
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data.data;

  // Persist auth state so ProtectedRoute and Navbar can read it without a network call
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      token,
      userId: user.userId,
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
    })
  );
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { success: true, user };
};

// ---------------------------------------------------------------------------
// logout()
// Clears local auth state immediately, then notifies the backend.
//
// ── Why localStorage is cleared BEFORE the await ────────────────────────────
// The Navbar calls logout() without await, then immediately calls
// navigate('/login'). If localStorage were cleared in a finally block
// (after the await), this race would occur:
//   1. logout() starts, hits `await api.post('/auth/logout')`, pauses.
//   2. navigate('/login') fires while localStorage is still set.
//   3. ProtectedRoute calls isAuthenticated() → still returns true.
//   4. ProtectedRoute redirects the user back to /dashboard.
//   5. User has to click Logout a second time.
//
// Clearing localStorage synchronously on the first line fixes the race:
// by the time navigate() runs, isAuthenticated() already returns false.
// ---------------------------------------------------------------------------
const logout = async () => {
  // Step 1 – clear local auth state synchronously so any subsequent
  // isAuthenticated() call (e.g. from ProtectedRoute) returns false immediately.
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  // Note: travelz_settings is intentionally kept so theme preference survives re-login.

  // Step 2 – tell the backend to invalidate the session token (best-effort).
  // We do NOT need to await this in the Navbar call path – the user is already
  // signed out locally by the time navigate('/login') fires.
  try {
    await api.post('/auth/logout');
  } catch {
    // Silently ignore – local state is already cleared above.
  }
};

// ---------------------------------------------------------------------------
// getCurrentUser()
// Fetches the authenticated user's fresh profile from the backend.
// The Authorization header is injected automatically by the api.js interceptor.
// Falls back to the locally cached user if the request fails.
// ---------------------------------------------------------------------------
const getCurrentUser = async () => {
  try {
    // GET /api/users/me
    const response = await api.get('/users/me');
    const user = response.data.data;
    // Keep the local cache up to date
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    // Return locally cached user on network error (degrade gracefully)
    return getStoredUser();
  }
};

// ---------------------------------------------------------------------------
// isAuthenticated()
// Synchronous check used by ProtectedRoute to decide whether to render or redirect.
// ---------------------------------------------------------------------------
const isAuthenticated = () => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return false;
  try {
    const { isLoggedIn, token } = JSON.parse(raw);
    return isLoggedIn === true && Boolean(token);
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// getStoredUser()
// Returns the cached user object without a network call.
// Used by Navbar and Dashboard to display the user's name immediately on render.
// ---------------------------------------------------------------------------
const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export { login, logout, getCurrentUser, isAuthenticated, getStoredUser };
