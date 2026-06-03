// middleware/authorize.js
// -----------------------
// Purpose: Role-based access control (RBAC) middleware.
//          Runs AFTER authMiddleware so req.user is already populated.
//
// Logic:
//   - admin / manager → may modify any record.
//   - user            → may only modify their own record (userId matches :id param).
//   - All others      → 403 Forbidden.
//
// Usage:
//   router.put('/:id', authMiddleware, authorize(['admin', 'manager']), controller.update);

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by authMiddleware; fall back to legacy headers for Postman testing
    const userRole    = (req.user && req.user.userRole) || req.headers['x-user-role'];
    const userId      = (req.user && req.user.userId)   || Number(req.headers['x-user-id']);
    const requestedId = Number(req.params.id);

    if (!userRole) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Missing user role.',
          details: {}
        }
      });
    }

    // Admins and managers can modify any record in the allowed-roles list
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Regular users can only modify their own record
    if (userRole === 'user' && requestedId === userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
        details: {}
      }
    });
  };
};

module.exports = authorize;
