const jwt   = require('jsonwebtoken');
const { User } = require('../../models/associations');

const JWT_SECRET = process.env.JWT_SECRET || 'travelz_jwt_fallback';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null,
      error: { code: 'UNAUTHORIZED', message: 'No authentication token provided. Please log in.' }
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, data: null,
      error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid. Please log in again.' }
    });
  }

  try {
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, data: null,
        error: { code: 'USER_NOT_FOUND', message: 'Authenticated user no longer exists.' }
      });
    }

    // Attach fields in the shape the rest of the app expects
    req.user   = user;
    req.user.userId   = user.id;       // alias id → userId
    req.user.userRole = user.role;     // alias role → userRole
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
};

module.exports = authMiddleware;
