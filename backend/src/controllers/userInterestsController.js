const { Op } = require('sequelize');
const { UserInterest, Interest } = require('../../models/associations');

// GET /api/users/:id/interests
// Two-step query – avoids any Sequelize include/association issues entirely.
exports.getUserInterests = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    // Step 1: get the interestId values for this user
    const rows = await UserInterest.findAll({
      where: { userId },
      attributes: ['interestId'],
      raw: true,
    });

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: [], error: null });
    }

    // Step 2: fetch the actual Interest records by those IDs
    const ids = rows.map(r => r.interestId);
    const interests = await Interest.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['name', 'ASC']],
    });

    res.status(200).json({ success: true, data: interests, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// POST /api/users/:id/interests
// Full replace: delete all then bulk-insert the new set.
exports.setUserInterests = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { interestIds } = req.body;

    if (!Array.isArray(interestIds)) {
      return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'interestIds must be an array' } });
    }

    await UserInterest.destroy({ where: { userId } });

    if (interestIds.length > 0) {
      await UserInterest.bulkCreate(
        interestIds.map(interestId => ({ userId, interestId: Number(interestId) })),
        { ignoreDuplicates: true }
      );
    }

    res.status(200).json({ success: true, data: { userId, count: interestIds.length }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// POST /api/users/:id/interests/:interestId
// Add a single interest to a user (idempotent).
exports.addUserInterest = async (req, res) => {
  try {
    const userId     = Number(req.params.id);
    const interestId = Number(req.params.interestId);
    await UserInterest.findOrCreate({ where: { userId, interestId } });
    res.status(200).json({ success: true, data: { userId, interestId }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// DELETE /api/users/:id/interests/:interestId
// Remove a single interest from a user.
exports.removeUserInterest = async (req, res) => {
  try {
    const userId     = Number(req.params.id);
    const interestId = Number(req.params.interestId);
    await UserInterest.destroy({ where: { userId, interestId } });
    res.status(200).json({ success: true, data: { userId, interestId }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
