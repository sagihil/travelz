// routes/attractionsRoutes.js
// ----------------------------
// Purpose: Defines the attractions resource endpoints mounted at /api/attractions.
//
// Authorization rules (mirror the backend RBAC model):
//   GET    – public; anyone can read attraction data.
//   POST   – admin or manager; must be authenticated.
//   PUT    – admin or manager; must be authenticated.
//   DELETE – admin only; must be authenticated.
//
// authMiddleware is applied to all mutating routes so req.user is set
// before authorize() runs. Without it, req.user would be null and
// authorize() would fall back to the x-user-role header which the
// frontend does not send.

const express               = require('express');
const router                = express.Router();
const attractionsController = require('../controllers/attractionsController');
const authorize             = require('../middleware/authorize');
const authMiddleware        = require('../middleware/authMiddleware');

// Public read routes – no authentication required
router.get('/',    attractionsController.getAllAttractions);
router.get('/:id', attractionsController.getAttractionById);

// Create – admin or manager
router.post('/', authMiddleware, authorize(['admin', 'manager']), attractionsController.createAttraction);

// Update – admin or manager
router.put('/:id', authMiddleware, authorize(['admin', 'manager']), attractionsController.updateAttraction);

// Delete – admin only
router.delete('/:id', authMiddleware, authorize(['admin']), attractionsController.deleteAttraction);

module.exports = router;
