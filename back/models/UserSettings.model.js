const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserSettings = sequelize.define('user_settings', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  city: { type: DataTypes.STRING(100), defaultValue: 'Mumbai' },
  country: { type: DataTypes.STRING(100), defaultValue: 'India' },
});

module.exports = UserSettings;
