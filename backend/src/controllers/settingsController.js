const { User } = require('../../models/associations');

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, data: null,
      error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
    });
    res.status(200).json({
      success: true,
      data: {
        userId:    user.id,
        firstName: user.firstName || '',
        lastName:  user.lastName  || '',
        email:     user.email,
        userRole:  user.role,
        theme:     user.theme || 'light',
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  const { firstName, lastName, email, theme } = req.body;
  if (!firstName || !lastName || !email || !theme) {
    return res.status(400).json({ success: false, data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: firstName, lastName, email, theme.' }
    });
  }
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, data: null,
      error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
    });

    await user.update({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      name:      `${firstName.trim()} ${lastName.trim()}`,
      email:     email.trim().toLowerCase(),
      theme,
    });

    res.status(200).json({
      success: true,
      data: {
        userId:    user.id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        userRole:  user.role,
        theme:     user.theme,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
