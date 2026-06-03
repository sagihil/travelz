// models/settings.js
// ------------------
// Purpose: In-memory per-user settings store.
//
// Structure: Map<userId, { theme }>
//   - Key:   userId (number)
//   - Value: A settings object. Currently only `theme` ('light' | 'dark').
//
// The Map starts empty; settingsController falls back to sensible defaults
// when a user's entry does not exist yet.
//
// Used by: settingsController (GET /api/settings, PUT /api/settings)

const settingsStore = new Map();

module.exports = settingsStore;
