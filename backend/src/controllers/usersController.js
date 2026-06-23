const bcrypt = require('bcrypt');
const { User } = require('../../models/associations');
const SALT_ROUNDS = 10;

// Shape the frontend Dashboard/Navbar expects
const toDTO = (user) => ({
  userId:    user.id,
  firstName: user.firstName || '',
  lastName:  user.lastName  || '',
  email:     user.email,
  userRole:  user.role,
});

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id','firstName','lastName','email','role'], order: [['id','ASC']] });
    res.status(200).json({ success: true, data: users.map(toDTO), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    // req.user is the live DB instance set by authMiddleware
    res.status(200).json({ success: true, data: toDTO(req.user), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'INVALID_ID', message: 'User id must be a valid number' }
    });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, data: null,
      error: { code: 'USER_NOT_FOUND', message: 'User not found', details: { userId: id } }
    });
    res.status(200).json({ success: true, data: toDTO(user), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// POST /api/users  — admin creates a new user
exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password, userRole } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'VALIDATION_ERROR', message: 'firstName and lastName are required' }
    });
  }
  try {
    const hashed = await bcrypt.hash(password || 'ChangeMe@1', SALT_ROUNDS);
    const autoEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g,'.')}@travelz.com`;
    const user = await User.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: autoEmail,
      password: hashed,
      role: userRole || 'user',
      theme: 'light',
    });
    res.status(201).json({ success: true, data: { userId: user.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// PUT /api/users/:id  — admin/manager updates a user
exports.updateUser = async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'INVALID_ID', message: 'User id must be a valid number' }
    });
  }
  const { firstName, lastName, userRole } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'VALIDATION_ERROR', message: 'firstName and lastName are required' }
    });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, data: null,
      error: { code: 'USER_NOT_FOUND', message: 'User not found', details: { userId: id } }
    });
    await user.update({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      role: userRole || user.role,
    });
    res.status(200).json({ success: true, data: { userId: user.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'INVALID_ID', message: 'User id must be a valid number' }
    });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, data: null,
      error: { code: 'USER_NOT_FOUND', message: 'User not found', details: { userId: id } }
    });
    await user.destroy();
    res.status(200).json({ success: true, data: { userId: id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
