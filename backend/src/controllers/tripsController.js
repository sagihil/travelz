const { Trip, User } = require('../../models/associations');
const socketModule   = require('../socket');

const FORBIDDEN = (res, msg = 'You do not have permission to perform this action.') =>
  res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: msg } });

exports.getAllTrips = async (req, res) => {
  try {
    const role  = req.user.userRole;
    const where = role === 'user' ? { userId: req.user.userId } : {};
    const trips = await Trip.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['id', 'DESC']]
    });
    res.status(200).json({ success: true, data: trips, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    if (!trip) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Trip not found' } });

    const role = req.user.userRole;
    if (role === 'user' && trip.userId !== req.user.userId) {
      return FORBIDDEN(res, 'You can only view your own trips.');
    }

    res.status(200).json({ success: true, data: trip, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.createTrip = async (req, res) => {
  try {
    const role = req.user.userRole;
    // Admin may supply an explicit userId to create trips on behalf of another user
    const userId = (role === 'admin' && req.body.userId) ? req.body.userId : req.user.userId;
    const { title, description, startDate, endDate } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
    }
    const trip = await Trip.create({ userId, title, description, startDate, endDate });

    const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;

    socketModule.emit('trip_created', {
      tripId:    trip.id,
      tripName:  trip.title,
      userName,
      createdAt: new Date().toISOString(),
      message:   `New trip created: ${trip.title}`,
    });

    res.status(201).json({ success: true, data: { id: trip.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Trip not found' } });

    const role = req.user.userRole;
    if (role !== 'admin' && trip.userId !== req.user.userId) {
      return FORBIDDEN(res, 'You can only edit your own trips.');
    }

    const { title, description, startDate, endDate } = req.body;
    await trip.update({ title, description, startDate, endDate });

    const updatedBy = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;

    socketModule.emit('trip_updated', {
      tripId:        trip.id,
      updatedFields: { title, description, startDate, endDate },
      updatedBy,
      updatedAt:     new Date().toISOString(),
      message:       `Trip updated: ${trip.title}`,
    });

    res.status(200).json({ success: true, data: { id: trip.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Trip not found' } });

    const role = req.user.userRole;
    if (role !== 'admin' && trip.userId !== req.user.userId) {
      return FORBIDDEN(res, 'You can only delete your own trips.');
    }

    await trip.destroy();
    res.status(200).json({ success: true, data: { id: Number(req.params.id) }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
