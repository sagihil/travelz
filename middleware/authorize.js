const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.headers["x-user-role"];
    const userId = Number(req.headers["x-user-id"]);
    const requestedId = Number(req.params.id);

    if (!userRole) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "Missing user role.",
          details: {}
        }
      });
    }

    // admin / manager יכולים לערוך הכל
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // user רגיל יכול לערוך רק את עצמו
    if (userRole === "user" && requestedId === userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
        details: {}
      }
    });
  };
};

module.exports = authorize;