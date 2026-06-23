const express       = require('express');
const router        = express.Router();
const aiController  = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/ai/travel-agent
// Requires a valid JWT; trip ownership is verified inside the controller.
router.post('/travel-agent', authMiddleware, aiController.travelAgent);

module.exports = router;
