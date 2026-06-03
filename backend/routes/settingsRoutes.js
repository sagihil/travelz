// routes/settingsRoutes.js
// -------------------------
// Purpose: Defines the settings endpoints mounted at /api/settings.
//
// Routes:
//   GET /api/settings  – Returns the authenticated user's profile + preferences.
//   PUT /api/settings  – Updates the authenticated user's profile + preferences.
//
// Both routes require a valid Bearer token (enforced by authMiddleware).
// authMiddleware attaches req.user before settingsController runs.

const express             = require('express');
const router              = express.Router();
const settingsController  = require('../controllers/settingsController');
const authMiddleware       = require('../middleware/authMiddleware');

// Both endpoints are protected – user must be logged in
router.get('/',  authMiddleware, settingsController.getSettings);
router.put('/',  authMiddleware, settingsController.updateSettings);

module.exports = router;
