// controllers/settingsController.js
// -----------------------------------
// Purpose: Handles user settings – a unified view combining the user's profile
//          fields (name, email) with their UI preferences (theme).
//
// Endpoints handled:
//   GET /api/settings  → getSettings()    – returns current settings for the logged-in user
//   PUT /api/settings  → updateSettings() – saves updated settings
//
// Both endpoints require authMiddleware, so req.user is always available.
//
// Data sources:
//   - Name / email / role → models/users.js (the live user object)
//   - Theme preference    → models/settings.js (in-memory Map keyed by userId)
//
// Design note:
//   Storing theme in a separate settings Map keeps concerns separated:
//   the users array is about identity; the settingsStore is about preferences.

const users        = require('../models/users');
const settingsStore = require('../models/settings');

// Helper: strip the password field before returning user data
const sanitizeUser = ({ password, ...rest }) => rest;

// Default values applied when a user has not saved preferences yet
const DEFAULTS = { theme: 'light' };

// ---------------------------------------------------------------------------
// getSettings(req, res)
// Returns the authenticated user's profile merged with their saved preferences.
// ---------------------------------------------------------------------------
exports.getSettings = (req, res) => {
  const user     = req.user;  // set by authMiddleware
  const prefs    = settingsStore.get(user.userId) || DEFAULTS;

  return res.status(200).json({
    success: true,
    data: {
      ...sanitizeUser(user),
      theme: prefs.theme
    },
    error: null
  });
};

// ---------------------------------------------------------------------------
// updateSettings(req, res)
// Body: { firstName, lastName, email, theme }
// Updates the live user object AND the preferences store.
// ---------------------------------------------------------------------------
exports.updateSettings = (req, res) => {
  const { firstName, lastName, email, theme } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !theme) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: firstName, lastName, email, theme.',
        details: { requiredFields: ['firstName', 'lastName', 'email', 'theme'] }
      }
    });
  }

  // Update the live user record (mutates the shared array element)
  req.user.firstName  = firstName;
  req.user.lastName   = lastName;
  req.user.email      = email;
  req.user.updateDate = new Date();

  // Persist the theme preference
  settingsStore.set(req.user.userId, { theme });

  return res.status(200).json({
    success: true,
    data: {
      ...sanitizeUser(req.user),
      theme
    },
    error: null
  });
};
