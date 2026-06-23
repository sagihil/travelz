const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const Attraction = sequelize.define('Attraction', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING,  allowNull: false },
  city:        { type: DataTypes.STRING },
  country:     { type: DataTypes.STRING },
  category:    { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  rating:      { type: DataTypes.FLOAT },
  imageUrl:    { type: DataTypes.STRING },
  latitude:    { type: DataTypes.FLOAT,   allowNull: true },
  longitude:   { type: DataTypes.FLOAT,   allowNull: true },
}, { tableName: 'attractions', timestamps: false });

module.exports = Attraction;
