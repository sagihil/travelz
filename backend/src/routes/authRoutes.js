// routes/authRoutes.js
// ---------------------
// Purpose: Defines the authentication endpoints mounted at /api/auth.
//
// Routes:
//   POST /api/auth/login   – Public. Validates email + password, returns token.
//   POST /api/auth/logout  – Protected (requires valid Bearer token). Invalidates token.
//
// authMiddleware is applied to /logout so the token is available on req for deletion.

const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route – no auth required to log in
router.post('/login',    authController.login);
router.post('/register', authController.register);

// Protected route – must send a valid token to log out
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
