const express = require('express');
const axios = require('axios');
const router = express.Router();
const OutfitSuggestion = require('../models/OutfitSuggestion.model');
const WardrobeItem = require('../models/WardrobeItem.model');
const CalendarEvent = require('../models/CalendarEvent.model');
const UserSettings = require('../models/UserSettings.model');
const { suggestOutfitsForWeek } = require('../utils/outfitSuggester');

function buildItemMap(items) {
  const map = {};
  items.forEach(i => { map[i.id] = i; });
  return map;
}

function enrichSuggestions(suggestions, itemMap) {
  return suggestions.map(s => {
    const plain = s.toJSON ? s.toJSON() : s;
    return {
      ...plain,
      items: (plain.itemIds || []).map(id => itemMap[id] ? itemMap[id].toJSON ? itemMap[id].toJSON() : itemMap[id] : null).filter(Boolean),
    };
  });
}

router.get('/', async (req, res) => {
  try {
    const suggestions = await OutfitSuggestion.findAll({ order: [['date', 'ASC']] });
    const allItems = await WardrobeItem.findAll();
    const itemMap = buildItemMap(allItems);
    res.json(enrichSuggestions(suggestions, itemMap));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ where: { id: 1 } });
    const city = settings ? settings.city : 'Mumbai';

    const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
      timeout: 8000,
    });

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      return res.status(400).json({ message: `Could not find city "${city}" for weather lookup` });
    }

    const { latitude, longitude } = geoRes.data.results[0];

    const forecastRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: 7,
      },
      timeout: 8000,
    });

    const weekWeather = forecastRes.data;
    const allItems = await WardrobeItem.findAll();
    const calendarEvents = await CalendarEvent.findAll();
    const eventsPlain = calendarEvents.map(e => e.toJSON());

    const suggestions = suggestOutfitsForWeek(allItems, weekWeather, eventsPlain);
    const dates = weekWeather.daily.time;

    await OutfitSuggestion.destroy({ where: { date: dates } });

    const created = await Promise.all(
      suggestions.map(s =>
        OutfitSuggestion.create({
          date: s.date,
          itemIds: s.itemIds,
          weatherContext: s.weatherContext,
          eventContext: s.eventContext,
          status: 'suggested',
        })
      )
    );

    const itemMap = buildItemMap(allItems);
    const enriched = created.map((s, idx) => ({
      ...s.toJSON(),
      items: (s.itemIds || []).map(id => itemMap[id] ? itemMap[id].toJSON() : null).filter(Boolean),
      eventTitle: suggestions[idx].eventTitle,
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Generate outfits error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/worn', async (req, res) => {
  try {
    const suggestion = await OutfitSuggestion.findByPk(req.params.id);
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    await suggestion.update({ status: 'worn', wornAt: new Date() });

    if (suggestion.itemIds && suggestion.itemIds.length > 0) {
      await Promise.all(
        suggestion.itemIds.map(async id => {
          const item = await WardrobeItem.findByPk(id);
          if (item) {
            await item.update({
              wornCount: (item.wornCount || 0) + 1,
              wornSinceWash: (item.wornSinceWash || 0) + 1,
              lastWorn: new Date(),
            });
          }
        })
      );
    }

    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/unworn', async (req, res) => {
  try {
    const suggestion = await OutfitSuggestion.findByPk(req.params.id);
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    await suggestion.update({ status: 'suggested', wornAt: null });

    if (suggestion.itemIds && suggestion.itemIds.length > 0) {
      await Promise.all(
        suggestion.itemIds.map(async id => {
          const item = await WardrobeItem.findByPk(id);
          if (item) {
            await item.update({
              wornCount: Math.max(0, (item.wornCount || 0) - 1),
              wornSinceWash: Math.max(0, (item.wornSinceWash || 0) - 1),
            });
          }
        })
      );
    }

    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
