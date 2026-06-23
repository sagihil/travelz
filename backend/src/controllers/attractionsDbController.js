const { Attraction } = require('../../models/associations');
const socketModule   = require('../socket');

exports.getAllAttractions = async (req, res) => {
  try {
    const where = req.query.country ? { country: req.query.country } : {};
    const attractions = await Attraction.findAll({ where });
    res.status(200).json({ success: true, data: attractions, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.getAttractionById = async (req, res) => {
  try {
    const attraction = await Attraction.findByPk(req.params.id);
    if (!attraction) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Attraction not found' } });
    res.status(200).json({ success: true, data: attraction, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.createAttraction = async (req, res) => {
  try {
    const { name, city, country, category, description, rating, imageUrl } = req.body;
    if (!name) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });

    const attraction = await Attraction.create({ name, city, country, category, description, rating, imageUrl });

    // ── Real-time broadcast ────────────────────────────────────────────────
    const addedBy = req.user
      ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email
      : null;

    socketModule.emit('attraction_created', {
      attraction: {
        id:          attraction.id,
        name:        attraction.name,
        city:        attraction.city,
        country:     attraction.country,
        category:    attraction.category,
        rating:      attraction.rating,
        imageUrl:    attraction.imageUrl,
        description: attraction.description,
        latitude:    attraction.latitude,
        longitude:   attraction.longitude,
      },
      addedBy,
      message:   `New attraction added: ${attraction.name}`,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: { id: attraction.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.updateAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findByPk(req.params.id);
    if (!attraction) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Attraction not found' } });
    const { name, city, country, category, description, rating, imageUrl } = req.body;
    await attraction.update({ name, city, country, category, description, rating, imageUrl });

    // ── Real-time broadcast ────────────────────────────────────────────────
    socketModule.emit('attraction_updated', {
      id:            attraction.id,
      name:          attraction.name,
      updatedFields: { name, city, country, category, description, rating, imageUrl },
      message:       `Attraction updated: ${attraction.name}`,
      updatedAt:     new Date().toISOString(),
    });

    res.status(200).json({ success: true, data: { id: attraction.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.deleteAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findByPk(req.params.id);
    if (!attraction) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Attraction not found' } });
    await attraction.destroy();
    res.status(200).json({ success: true, data: { id: Number(req.params.id) }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
