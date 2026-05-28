const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CalendarEvent = sequelize.define('calendar_event', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  eventType: { type: DataTypes.STRING(50), defaultValue: 'casual' },
});

module.exports = CalendarEvent;
