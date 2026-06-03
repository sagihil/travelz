// models/sessions.js
// ------------------
// Purpose: In-memory session store for active login tokens.
//
// Structure: Map<token, userId>
//   - Key:   A random string token generated at login time.
//   - Value: The userId of the authenticated user.
//
// Lifecycle:
//   - Token is created  → POST /api/auth/login  (authController.login)
//   - Token is read     → Every protected route via authMiddleware
//   - Token is deleted  → POST /api/auth/logout (authController.logout)
//
// Limitations: Because this is in-memory, all sessions are lost when the
// server restarts. A production application would use Redis or a database.
//
// Exported as a module-level singleton so all files share the same Map instance.

const sessions = new Map();

module.exports = sessions;
