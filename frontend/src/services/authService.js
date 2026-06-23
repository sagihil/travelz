import api from './api.js';

// Auth tokens live in sessionStorage so each browser tab keeps its own session.
// This allows User A in Tab A and User B in Tab B to coexist without conflicts.
// sessionStorage persists across page refreshes within the same tab but is
// cleared when the tab is closed.
//
// Theme preference stays in localStorage (shared, device-level preference).
const AUTH_KEY = 'travelz_auth';
const USER_KEY = 'travelz_user';

// ---------------------------------------------------------------------------
// login(email, password)
// ---------------------------------------------------------------------------
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data.data;

  sessionStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      token,
      userId:    user.userId,
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
    })
  );
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));

  return { success: true, user };
};

// ---------------------------------------------------------------------------
// logout()
// Clears session-specific auth immediately, then tells the backend.
// ---------------------------------------------------------------------------
const logout = async () => {
  // Clear synchronously so ProtectedRoute sees the change before navigate() fires
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);

  try {
    await api.post('/auth/logout');
  } catch {
    // Backend logout is best-effort; local state is already cleared
  }
};

// ---------------------------------------------------------------------------
// getCurrentUser()
// Fetches a fresh profile from the backend and keeps the local cache in sync.
// ---------------------------------------------------------------------------
const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me');
    const user = response.data.data;
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return getStoredUser();
  }
};

// ---------------------------------------------------------------------------
// isAuthenticated() — synchronous, used by ProtectedRoute
// ---------------------------------------------------------------------------
const isAuthenticated = () => {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return false;
  try {
    const { isLoggedIn, token } = JSON.parse(raw);
    return isLoggedIn === true && Boolean(token);
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// getStoredUser() — returns cached user without a network call
// ---------------------------------------------------------------------------
const getStoredUser = () => {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// register(firstName, lastName, email, password)
// ---------------------------------------------------------------------------
const register = async (firstName, lastName, email, password) => {
  const response = await api.post('/auth/register', { firstName, lastName, email, password });
  const { token, user } = response.data.data;

  sessionStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ token, userId: user.userId, isLoggedIn: true, loginTime: new Date().toISOString() })
  );
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));

  return { success: true, user };
};

export { login, logout, register, getCurrentUser, isAuthenticated, getStoredUser };
