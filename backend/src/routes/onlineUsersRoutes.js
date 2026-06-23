const express        = require('express');
const router         = express.Router();
const controller     = require('../controllers/onlineUsersController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, controller.getOnlineUsers);

module.exports = router;
