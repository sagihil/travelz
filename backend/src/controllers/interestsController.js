const { Interest, UserInterest } = require('../../models/associations');

exports.getAllInterests = async (req, res) => {
  try {
    const interests = await Interest.findAll({ order: [['name', 'ASC']] });
    res.status(200).json({ success: true, data: interests, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.getInterestById = async (req, res) => {
  try {
    const interest = await Interest.findByPk(req.params.id);
    if (!interest) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Interest not found' } });
    res.status(200).json({ success: true, data: interest, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Any authenticated user can create a custom interest.
// findOrCreate prevents duplicates — returns the existing one if the name already exists.
exports.createInterest = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    const [interest, created] = await Interest.findOrCreate({ where: { name } });
    res.status(created ? 201 : 200).json({ success: true, data: { id: interest.id, name: interest.name, created }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.updateInterest = async (req, res) => {
  try {
    const interest = await Interest.findByPk(req.params.id);
    if (!interest) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Interest not found' } });
    await interest.update({ name: (req.body.name || '').trim() });
    res.status(200).json({ success: true, data: { id: interest.id }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// POST /api/interests/custom
// Creates the interest (findOrCreate) then links it to the authenticated user.
exports.createCustomInterest = async (req, res) => {
  try {
    const name   = (req.body.name || '').trim();
    const userId = req.user?.userId;
    if (!name) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });

    const [interest, created] = await Interest.findOrCreate({ where: { name } });

    if (userId) {
      await UserInterest.findOrCreate({ where: { userId, interestId: interest.id } });
    }

    res.status(created ? 201 : 200).json({
      success: true,
      data: { id: interest.id, name: interest.name, created },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

exports.deleteInterest = async (req, res) => {
  try {
    const interest = await Interest.findByPk(req.params.id);
    if (!interest) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Interest not found' } });
    await interest.destroy();
    res.status(200).json({ success: true, data: { id: Number(req.params.id) }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
