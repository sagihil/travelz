const express                 = require('express');
const router                  = express.Router();
const usersController         = require('../controllers/usersController');
const userInterestsController = require('../controllers/userInterestsController');
const authorize               = require('../middleware/authorize');
const authMiddleware          = require('../middleware/authMiddleware');

// /me must be declared before /:id
router.get('/me', authMiddleware, usersController.getMe);

router.get('/',    authMiddleware, usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/',   usersController.createUser);

router.put('/:id',    authMiddleware, authorize(['admin', 'manager']), usersController.updateUser);
router.delete('/:id', authMiddleware, authorize(['admin']),            usersController.deleteUser);

// ── User interests ──────────────────────────────────────────────────────────
// Note: specific routes (/:id/interests/:interestId) must come BEFORE
// the generic (/:id/interests) so Express matches correctly.
router.get('/:id/interests',                      userInterestsController.getUserInterests);
router.post('/:id/interests',    authMiddleware,  userInterestsController.setUserInterests);   // full replace
router.post('/:id/interests/:interestId',  authMiddleware, userInterestsController.addUserInterest);   // add one
router.delete('/:id/interests/:interestId', authMiddleware, userInterestsController.removeUserInterest); // remove one

module.exports = router;
