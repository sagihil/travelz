const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { User } = require('../../models/associations');

const JWT_SECRET  = process.env.JWT_SECRET || 'travelz_jwt_fallback';
const JWT_EXPIRES = '7d';

// Map DB user → the shape the frontend expects
const toDTO = (user) => ({
  userId:    user.id,
  firstName: user.firstName || '',
  lastName:  user.lastName  || '',
  email:     user.email,
  userRole:  user.role,
  theme:     user.theme || 'light',
});

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' }
    });
  }

  try {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(401).json({ success: false, data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(200).json({
      success: true,
      data: { token, user: toDTO(user) },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'VALIDATION_ERROR', message: 'All fields are required.' }
    });
  }

  try {
    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, data: null,
        error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' }
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name:      `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim().toLowerCase(),
      password:  hashed,
      role:      'user',
      theme:     'light',
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(201).json({
      success: true,
      data: { token, user: toDTO(user) },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
};

// POST /api/auth/logout  — JWT is stateless; just acknowledge
exports.logout = (req, res) => {
  return res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully.' },
    error: null,
  });
};
