// middleware/authMiddleware.js
// ----------------------------
// Purpose: Protects routes by verifying the Bearer token sent in the
//          Authorization header of every request.
//
// How it works:
//   1. Reads the "Authorization: Bearer <token>" header from the request.
//   2. Looks the token up in the in-memory sessions Map (models/sessions.js).
//   3. If found, retrieves the corresponding user from models/users.js and
//      attaches it to req.user so downstream controllers can access it.
//   4. If missing or invalid, responds with 401 Unauthorized immediately.
//
// Usage in routes:
//   router.get('/me', authMiddleware, usersController.getMe);
//
// This middleware must run BEFORE any other middleware that needs req.user.

const sessions = require('../models/sessions');
const users    = require('../models/users');

const authMiddleware = (req, res, next) => {
  // Step 1: Extract the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authentication token provided. Please log in.',
        details: {}
      }
    });
  }

  // Step 2: Parse the token string after "Bearer "
  const token = authHeader.split(' ')[1];

  // Step 3: Look up the token in the session store
  const userId = sessions.get(token);

  if (!userId) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Session expired or invalid. Please log in again.',
        details: {}
      }
    });
  }

  // Step 4: Find the full user object
  const user = users.find((u) => u.userId === userId);

  if (!user) {
    // Token pointed to a userId that no longer exists – clean up the orphaned session
    sessions.delete(token);
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Authenticated user no longer exists.',
        details: {}
      }
    });
  }

  // Step 5: Attach the user to the request object for downstream use
  req.user   = user;
  req.userId = user.userId;
  next();
};

module.exports = authMiddleware;
