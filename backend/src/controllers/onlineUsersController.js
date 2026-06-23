'use strict';
const socketModule = require('../socket');

// GET /api/online-users
// Admins: full list with loginTime and role.
// Everyone else: count only.
exports.getOnlineUsers = (req, res) => {
  const role  = req.user?.userRole ?? req.user?.role ?? 'user';
  const users = socketModule.getOnlineUsers();
  const count = socketModule.getOnlineCount();

  const payload = role === 'admin'
    ? {
        count,
        users: users.map(u => ({
          id:        u.userId,
          name:      u.userName,
          role:      u.role,
          loginTime: u.loginTime,
        })),
      }
    : { count, users: [] };

  return res.status(200).json({ success: true, data: payload, error: null });
};
