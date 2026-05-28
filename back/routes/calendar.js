const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent.model');

router.get('/', async (req, res) => {
  try {
    const events = await CalendarEvent.findAll({ order: [['date', 'ASC']] });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { date, title, eventType } = req.body;
    if (!date || !title) return res.status(400).json({ message: 'date and title are required' });
    const event = await CalendarEvent.create({ date, title, eventType: eventType || 'casual' });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const event = await CalendarEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
