// controllers/authController.js
// ------------------------------
// Purpose: Handles authentication: login and logout.
//
// Endpoints handled:
//   POST /api/auth/login   → login()   – validates credentials, creates session token
//   POST /api/auth/logout  → logout()  – invalidates the active session token
//
// Session management:
//   - On successful login a random token string is generated.
//   - The token is stored in the in-memory sessions Map (models/sessions.js)
//     with the userId as its value.
//   - The token is returned to the frontend inside the response body.
//   - The frontend stores the token in localStorage and sends it as
//     "Authorization: Bearer <token>" on every subsequent request.
//   - On logout the token is removed from the sessions Map, making it invalid.
//
// Password validation:
//   - Passwords are compared directly against the stored value in models/users.js.
//   - No hashing is used (acceptable for a university project).
//   - The backend NEVER returns the password field in any response.

const users   = require('../models/users');
const sessions = require('../models/sessions');

// ---------------------------------------------------------------------------
// Helper: generate a simple random session token
// ---------------------------------------------------------------------------
const generateToken = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15) +
  Date.now().toString(36);

// ---------------------------------------------------------------------------
// Helper: return a user object with the password field removed
// ---------------------------------------------------------------------------
const sanitizeUser = ({ password, ...rest }) => rest;

// ---------------------------------------------------------------------------
// login(req, res)
// Body: { email, password }
// Flow:
//   1. Validate that both fields are present.
//   2. Find a user whose email matches (case-insensitive).
//   3. Compare the supplied password against the stored password (exact match).
//   4. Generate a session token, store it, and return it with the user profile.
// ---------------------------------------------------------------------------
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Step 1 – both fields are required
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
        details: {}
      }
    });
  }

  // Step 2 – find user by email (case-insensitive)
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  // Step 3 – reject if user not found OR password is wrong
  // We return the same generic message in both cases to avoid leaking
  // whether a given email is registered (security best practice).
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        details: {}
      }
    });
  }

  // Step 4 – create a session token and persist it
  const token = generateToken();
  sessions.set(token, user.userId);

  // Respond with the token and user profile (no password)
  return res.status(200).json({
    success: true,
    data: {
      token,
      user: sanitizeUser(user)
    },
    error: null
  });
};

// ---------------------------------------------------------------------------
// logout(req, res)
// Requires: Authorization: Bearer <token> header (enforced by authMiddleware)
// Flow: delete the token from the sessions Map → it is now permanently invalid
// ---------------------------------------------------------------------------
exports.logout = (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  sessions.delete(token);

  return res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully.' },
    error: null
  });
};
