// controllers/usersController.js
// --------------------------------
// Purpose: CRUD operations for the /api/users resource.
//
// All response objects follow the shape: { success, data, error }
//
// IMPORTANT: The password field is NEVER included in any response.
//            sanitizeUser() strips it before every JSON reply.
//
// Endpoints:
//   GET    /api/users         → getAllUsers
//   GET    /api/users/me      → getMe       (requires authMiddleware)
//   GET    /api/users/:id     → getUserById
//   POST   /api/users         → createUser
//   PUT    /api/users/:id     → updateUser  (requires authorize)
//   DELETE /api/users/:id     → deleteUser  (requires authorize)

const users = require('../models/users');

// Helper: remove the password from a user object before sending it in a response
const sanitizeUser = ({ password, ...rest }) => rest;

// Helper: generate the next available userId
const getNextId = () =>
  users.length === 0 ? 1 : Math.max(...users.map((u) => u.userId)) + 1;

// ---------------------------------------------------------------------------
// GET /api/users  → returns all users (passwords removed)
// ---------------------------------------------------------------------------
exports.getAllUsers = (req, res) => {
  res.status(200).json({
    success: true,
    data: users.map(sanitizeUser),
    error: null
  });
};

// ---------------------------------------------------------------------------
// GET /api/users/me  → returns the authenticated user's profile
// req.user is set by authMiddleware, which must run before this handler.
// ---------------------------------------------------------------------------
exports.getMe = (req, res) => {
  res.status(200).json({
    success: true,
    data: sanitizeUser(req.user),
    error: null
  });
};

// ---------------------------------------------------------------------------
// GET /api/users/:id  → returns a single user by numeric ID
// ---------------------------------------------------------------------------
exports.getUserById = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_ID',
        message: 'User id must be a valid number',
        details: { id: req.params.id }
      }
    });
  }

  const user = users.find((u) => u.userId === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: { userId: id }
      }
    });
  }

  res.status(200).json({
    success: true,
    data: sanitizeUser(user),
    error: null
  });
};

// ---------------------------------------------------------------------------
// POST /api/users  → creates a new user
// Body: { firstName, lastName, userRole }
// Note: email and password are optional at creation; defaults are applied.
// ---------------------------------------------------------------------------
exports.createUser = (req, res) => {
  const { firstName, lastName, userRole, email, password } = req.body;

  if (!firstName || !lastName || !userRole) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: firstName, lastName, userRole',
        details: { requiredFields: ['firstName', 'lastName', 'userRole'] }
      }
    });
  }

  const newUser = {
    userId:     getNextId(),
    firstName,
    lastName,
    email:      email    || `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '.')}@travelz.com`,
    password:   password || 'ChangeMe@1',
    createDate: new Date(),
    updateDate: new Date(),
    userRole
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    data: { userId: newUser.userId },
    error: null
  });
};

// ---------------------------------------------------------------------------
// PUT /api/users/:id  → updates an existing user
// Body: { firstName, lastName, userRole }
// ---------------------------------------------------------------------------
exports.updateUser = (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, userRole } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_ID',
        message: 'User id must be a valid number',
        details: { id: req.params.id }
      }
    });
  }

  if (!firstName || !lastName || !userRole) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: firstName, lastName, userRole',
        details: { requiredFields: ['firstName', 'lastName', 'userRole'] }
      }
    });
  }

  const user = users.find((u) => u.userId === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: { userId: id }
      }
    });
  }

  user.firstName  = firstName;
  user.lastName   = lastName;
  user.userRole   = userRole;
  user.updateDate = new Date();

  res.status(200).json({
    success: true,
    data: { userId: user.userId },
    error: null
  });
};

// ---------------------------------------------------------------------------
// DELETE /api/users/:id  → removes a user
// ---------------------------------------------------------------------------
exports.deleteUser = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_ID',
        message: 'User id must be a valid number',
        details: { id: req.params.id }
      }
    });
  }

  const index = users.findIndex((u) => u.userId === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: { userId: id }
      }
    });
  }

  const deletedUser = users.splice(index, 1)[0];

  res.status(200).json({
    success: true,
    data: { userId: deletedUser.userId },
    error: null
  });
};
