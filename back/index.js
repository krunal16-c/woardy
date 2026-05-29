require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const sequelize = require('./config/database');

// Register all models
require('./models/WardrobeItem.model');
require('./models/CalendarEvent.model');
require('./models/OutfitSuggestion.model');
require('./models/UserSettings.model');
require('./models/CalendarConnection.model');

const app = express();

// ── Security middleware ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images from /uploads
}));

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:8888', 'http://127.0.0.1:8888'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// General rate limit: 200 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.path.startsWith('/uploads'), // static files don't need limiting
}));

app.use(express.json({ limit: '1mb' }));

// ── Static uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/db', require('./routes/db'));
app.use('/api/wardrobe', require('./routes/wardrobe'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/outfits', require('./routes/outfits'));
app.use('/api/laundry', require('./routes/laundry'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/google-calendar', require('./routes/googleCalendar'));
app.use('/api/apple-calendar', require('./routes/appleCalendar'));
app.use('/api/scan', require('./routes/scan'));

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    message: isDev ? err.message : 'Internal server error',
  });
});

// ── Startup ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3333;

sequelize
  .sync({ alter: { drop: false } })
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('[fatal] DB sync failed:', err.message);
    process.exit(1);
  });
