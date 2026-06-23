const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const Interest = sequelize.define('Interest', {
  id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true }
}, { tableName: 'interests', timestamps: false });

module.exports = Interest;
