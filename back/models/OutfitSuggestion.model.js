const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutfitSuggestion = sequelize.define('outfit_suggestion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  itemIds: { type: DataTypes.JSON, defaultValue: [] },
  weatherContext: { type: DataTypes.JSON, allowNull: true },
  eventContext: { type: DataTypes.STRING(100), defaultValue: 'casual' },
  status: { type: DataTypes.STRING(20), defaultValue: 'suggested' },
  wornAt: { type: DataTypes.DATE, allowNull: true },
});

module.exports = OutfitSuggestion;
