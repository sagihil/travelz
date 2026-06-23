const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const TripAttraction = sequelize.define('TripAttraction', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tripId:       { type: DataTypes.INTEGER, allowNull: false },
  attractionId: { type: DataTypes.INTEGER, allowNull: false },
  dayNumber:    { type: DataTypes.INTEGER },
  orderInDay:   { type: DataTypes.INTEGER },
  notes:        { type: DataTypes.TEXT }
}, { tableName: 'trip_attractions', timestamps: false });

module.exports = TripAttraction;
