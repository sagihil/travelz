const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const UserInterest = sequelize.define('UserInterest', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:     { type: DataTypes.INTEGER, allowNull: false },
  interestId: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'user_interests', timestamps: false });

module.exports = UserInterest;
