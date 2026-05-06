const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.headers["x-user-role"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
          details: {}
        }
      });
    }

    next();
  };
};

module.exports = authorize;