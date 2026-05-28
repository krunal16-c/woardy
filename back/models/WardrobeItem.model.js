const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WardrobeItem = sequelize.define('wardrobe_item', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  category: { type: DataTypes.STRING(50), allowNull: false },
  color: { type: DataTypes.STRING(50), defaultValue: '' },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  imageUrl: { type: DataTypes.STRING(500), allowNull: true },
  wornCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  wornSinceWash: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastWorn: { type: DataTypes.DATE, allowNull: true },
  lastWashed: { type: DataTypes.DATE, allowNull: true },
});

module.exports = WardrobeItem;
