const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CalendarConnection = sequelize.define('calendar_connection', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  // 'google' | 'apple'
  provider: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  // AES-256-GCM encrypted JSON: { access_token, refresh_token, expiry_date } for Google
  //                              { email, appPassword } for Apple
  encryptedPayload: { type: DataTypes.TEXT('long'), allowNull: false },
  // 'active' | 'expired' | 'error'
  status: { type: DataTypes.STRING(20), defaultValue: 'active' },
  lastSyncAt: { type: DataTypes.DATE, allowNull: true },
  // Metadata only — no PII stored in plaintext
  accountHint: { type: DataTypes.STRING(100), allowNull: true },
});

module.exports = CalendarConnection;
