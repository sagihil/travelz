const { Trip, Attraction, TripAttraction } = require('../../models/associations');
const socketModule = require('../socket');

const FORBIDDEN = (res, msg = 'You do not have permission to perform this action.') =>
  res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: msg } });

exports.getTripAttractions = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [{ model: Attraction, through: { attributes: ['dayNumber', 'orderInDay', 'notes'] } }]
    });
    if (!trip) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Trip not found' } });

    const role = req.user.userRole;
    if (role === 'user' && trip.userId !== req.user.userId) {
      return FORBIDDEN(res, 'You can only view attractions for your own trips.');
    }

    res.status(200).json({ success: true, data: trip.Attractions, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.addAttractionToTrip = async (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const { attractionId, dayNumber, orderInDay, notes } = req.body;
    if (!attractionId) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'attractionId is required' } });

    const trip = await Trip.findByPk(tripId, { attributes: ['id', 'title', 'userId'] });
    if (!trip) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Trip not found' } });

    const role = req.user.userRole;
    if (role !== 'admin' && trip.userId !== req.user.userId) {
      return FORBIDDEN(res, 'You can only add attractions to your own trips.');
    }

    const exists = await TripAttraction.findOne({ where: { tripId, attractionId } });
    if (exists) return res.status(409).json({ success: false, data: null, error: { code: 'DUPLICATE', message: 'Attraction already in this trip' } });

    const entry = await TripAttraction.create({ tripId, attractionId, dayNumber, orderInDay, notes });

    const attraction = await Attraction.findByPk(attractionId, { attributes: ['id', 'name', 'city', 'country'] });

    socketModule.emit('attraction_added', {
      tripId,
      tripName:       trip.title,
      attractionId:   Number(attractionId),
      attractionName: attraction?.name    || '',
      city:           attraction?.city    || '',
      country:        attraction?.country || '',
      dayNumber:      dayNumber || null,
      addedAt:        new Date().toISOString(),
      message:        `${attraction?.name || 'Attraction'} added to trip "${trip.title}"`,
    });

    res.status(201).json({ success: true, data: { id: entry.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.removeAttractionFromTrip = async (req, res) => {
  try {
    const tripId       = Number(req.params.id);
    const attractionId = Number(req.params.attractionId);

    const trip = await Trip.findByPk(tripId, { attributes: ['id', 'userId'] });
    if (!trip) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Trip not found' } });

    const role = req.user.userRole;
    if (role !== 'admin' && trip.userId !== req.user.userId) {
      return FORBIDDEN(res, 'You can only remove attractions from your own trips.');
    }

    const entry = await TripAttraction.findOne({ where: { tripId, attractionId } });
    if (!entry) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Attraction not in this trip' } });
    await entry.destroy();
    res.status(200).json({ success: true, data: { tripId, attractionId }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
