const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const Trip = sequelize.define('Trip', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:      { type: DataTypes.INTEGER, allowNull: false },
  title:       { type: DataTypes.STRING,  allowNull: false },
  description: { type: DataTypes.TEXT },
  startDate:   { type: DataTypes.DATEONLY },
  endDate:     { type: DataTypes.DATEONLY }
}, { tableName: 'trips', timestamps: false });

module.exports = Trip;
