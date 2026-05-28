const express = require('express');
const router = express.Router();
const UserSettings = require('../models/UserSettings.model');

router.get('/', async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = await UserSettings.create({ id: 1, city: 'Mumbai', country: 'India' });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { city, country } = req.body;
    if (!city) return res.status(400).json({ message: 'city is required' });

    const [settings] = await UserSettings.upsert({ id: 1, city, country: country || '' });
    res.json(settings || { id: 1, city, country });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
