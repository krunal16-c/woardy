const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');

// Register models
require('./models/WardrobeItem.model');
require('./models/CalendarEvent.model');
require('./models/OutfitSuggestion.model');
require('./models/UserSettings.model');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/db', require('./routes/db'));
app.use('/api/wardrobe', require('./routes/wardrobe'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/outfits', require('./routes/outfits'));
app.use('/api/laundry', require('./routes/laundry'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/settings', require('./routes/settings'));

const PORT = process.env.PORT || 3333;

sequelize
  .sync({ alter: { drop: false } })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB sync failed:', err.message);
    process.exit(1);
  });
