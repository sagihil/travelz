// routes/usersRoutes.js
// ----------------------
// Purpose: Defines the user resource endpoints mounted at /api/users.
//
// Routes:
//   GET    /api/users     – Returns all users (auth required)
//   GET    /api/users/me  – Returns the authenticated user's own profile
//   GET    /api/users/:id – Returns a specific user by ID
//   POST   /api/users     – Creates a new user
//   PUT    /api/users/:id – Updates a user (admin/manager only)
//   DELETE /api/users/:id – Deletes a user (admin only)
//
// IMPORTANT: /me must be declared BEFORE /:id to prevent Express from
// treating the literal string "me" as an ID parameter.

const express           = require('express');
const router            = express.Router();
const usersController   = require('../controllers/usersController');
const authorize         = require('../middleware/authorize');
const authMiddleware    = require('../middleware/authMiddleware');

// GET /api/users/me  – must come before /:id
router.get('/me', authMiddleware, usersController.getMe);

// Auth-required read routes
router.get('/',    authMiddleware, usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/',   usersController.createUser);

// Protected mutation routes
router.put('/:id',    authMiddleware, authorize(['admin', 'manager']), usersController.updateUser);
router.delete('/:id', authMiddleware, authorize(['admin']),            usersController.deleteUser);

module.exports = router;
