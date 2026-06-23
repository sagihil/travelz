// services/settingsService.js
// ---------------------------
// Purpose: Manages user settings via dedicated backend endpoints.
//
// Backend endpoints used:
//   GET /api/settings  – Returns the authenticated user's profile + theme preference.
//                        Response shape: { success, data: { firstName, lastName,
//                        email, userRole, theme, userId } }
//   PUT /api/settings  – Saves updated profile + theme.
//                        Request body: { firstName, lastName, email, theme }
//                        Response shape: same as GET.
//
// The Authorization: Bearer <token> header is added automatically by the
// api.js Axios interceptor, so these functions only need to supply the body.
//
// applyTheme(theme):
//   A helper exported for use in both this service and the Settings page.
//   Toggles the "dark" CSS class on <html> so CSS custom properties in
//   index.css switch the entire app's colour scheme immediately.

import api from './api.js';
import { announcePresence } from './socketService.js';

// ---------------------------------------------------------------------------
// getSettings()
// Fetches the current settings from the backend.
// Returns a unified object: { firstName, lastName, email, userRole, theme, userId }
// ---------------------------------------------------------------------------
const getSettings = async () => {
  // GET /api/settings  (token injected by api.js interceptor)
  const response = await api.get('/settings');
  return response.data.data;
};

// ---------------------------------------------------------------------------
// updateSettings(settings)
// Sends updated settings to the backend and refreshes the cached user object.
// settings: { firstName, lastName, email, theme }
// ---------------------------------------------------------------------------
const updateSettings = async (settings) => {
  // PUT /api/settings  (token injected by api.js interceptor)
  const response = await api.put('/settings', {
    firstName: settings.firstName,
    lastName:  settings.lastName,
    email:     settings.email,
    theme:     settings.theme,
  });

  const updated = response.data.data;

  // Keep both storages in sync so Navbar and socket both see the updated name
  sessionStorage.setItem('travelz_user', JSON.stringify(updated));
  localStorage.setItem('travelz_user', JSON.stringify(updated));

  // Re-announce presence so the online users panel shows the updated name
  announcePresence();

  return { success: true, data: updated };
};

// ---------------------------------------------------------------------------
// applyTheme(theme)
// Toggles the "dark" class on the root <html> element.
// CSS variables in index.css respond to this class to switch colour schemes.
// Called immediately when the theme radio button changes (instant preview).
// ---------------------------------------------------------------------------
const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export { getSettings, updateSettings, applyTheme };
