const express             = require('express');
const router              = require('express').Router();
const interestsController = require('../controllers/interestsController');
const authMiddleware      = require('../middleware/authMiddleware');
const authorize           = require('../middleware/authorize');

router.get('/',    interestsController.getAllInterests);
router.get('/:id', interestsController.getInterestById);

// /custom must come BEFORE /:id so "custom" isn't treated as an id param
router.post('/custom', authMiddleware, interestsController.createCustomInterest);

// Any logged-in user may create a new named interest (findOrCreate = no duplicates)
router.post('/', authMiddleware, interestsController.createInterest);

router.put('/:id',    authMiddleware, authorize(['admin', 'manager']), interestsController.updateInterest);
router.delete('/:id', authMiddleware, authorize(['admin']),            interestsController.deleteInterest);

module.exports = router;
