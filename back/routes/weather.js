const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ message: 'city query param required' });

  try {
    const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
      timeout: 8000,
    });

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      return res.status(404).json({ message: 'City not found' });
    }

    const { latitude, longitude, name, country } = geoRes.data.results[0];

    const forecastRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max',
        current_weather: true,
        timezone: 'auto',
        forecast_days: 7,
      },
      timeout: 8000,
    });

    res.json({
      city: name,
      country,
      current: forecastRes.data.current_weather,
      daily: forecastRes.data.daily,
    });
  } catch (err) {
    console.error('Weather fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch weather', error: err.message });
  }
});

module.exports = router;
