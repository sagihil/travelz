const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const User = sequelize.define('User', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:      { type: DataTypes.STRING },                  // legacy full-name display field
  firstName: { type: DataTypes.STRING, allowNull: true },
  lastName:  { type: DataTypes.STRING, allowNull: true },
  email:     { type: DataTypes.STRING, allowNull: false, unique: true },
  password:  { type: DataTypes.STRING, allowNull: false },
  role:      { type: DataTypes.ENUM('user', 'manager', 'admin'), defaultValue: 'user' },
  theme:     { type: DataTypes.STRING, defaultValue: 'light' },
}, { tableName: 'users', timestamps: false });

module.exports = User;
