const express = require('express');
const router = express.Router();
const WardrobeItem = require('../models/WardrobeItem.model');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
  try {
    const items = await WardrobeItem.findAll({
      where: { wornSinceWash: { [Op.gte]: 2 } },
      order: [['wornSinceWash', 'DESC']],
    });

    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    res.json({ items, isWeekend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/wash', async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!itemIds || !itemIds.length) return res.status(400).json({ message: 'itemIds required' });

    await WardrobeItem.update(
      { wornSinceWash: 0, lastWashed: new Date() },
      { where: { id: itemIds } }
    );

    res.json({ message: 'Items marked as washed', count: itemIds.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
