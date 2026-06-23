const express                   = require('express');
const router                    = express.Router();
const tripsController           = require('../controllers/tripsController');
const tripAttractionsController = require('../controllers/tripAttractionsController');
const authMiddleware            = require('../middleware/authMiddleware');

// Trip CRUD — all routes require auth; ownership/role enforcement is in the controller
router.get('/',       authMiddleware, tripsController.getAllTrips);
router.get('/:id',    authMiddleware, tripsController.getTripById);
router.post('/',      authMiddleware, tripsController.createTrip);
router.put('/:id',    authMiddleware, tripsController.updateTrip);
router.delete('/:id', authMiddleware, tripsController.deleteTrip);

// Attractions inside a trip
router.get('/:id/attractions',                          authMiddleware, tripAttractionsController.getTripAttractions);
router.post('/:id/attractions',                         authMiddleware, tripAttractionsController.addAttractionToTrip);
router.delete('/:id/attractions/:attractionId',         authMiddleware, tripAttractionsController.removeAttractionFromTrip);

module.exports = router;
