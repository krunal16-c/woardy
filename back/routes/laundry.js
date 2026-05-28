'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const WardrobeItem = require('../models/WardrobeItem.model');
const { needsWashing, getWashThreshold, getUrgencyLevel } = require('../utils/laundryThreshold');

// GET /api/laundry
// Returns items whose wornSinceWash has reached the per-item threshold.
// Each item is augmented with washThreshold and urgency so the frontend
// can show contextual messaging without duplicating business logic.
router.get('/', async (req, res) => {
  try {
    // Pre-filter in DB: only fetch items worn at least once since last wash.
    // The per-item threshold check (needsWashing) runs in application layer.
    const all = await WardrobeItem.findAll({
      where: { wornSinceWash: { [Op.gt]: 0 } },
      order: [['wornSinceWash', 'DESC']],
    });

    const items = all
      .filter(row => needsWashing(row))
      .map(row => {
        const plain = row.toJSON();
        return {
          ...plain,
          washThreshold: getWashThreshold(plain),
          urgency: getUrgencyLevel(plain),
        };
      });

    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 5 || day === 6;

    res.json({ items, isWeekend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/laundry/wash
// Marks a set of items as freshly washed (resets wornSinceWash, records lastWashed).
router.put('/wash', async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!itemIds || !itemIds.length) {
      return res.status(400).json({ message: 'itemIds required' });
    }

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
