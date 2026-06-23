'use strict';
// Admin.js
// Admins are Users whose role = 'admin'.
// This model provides a filtered view of the users table for admin-specific
// queries, satisfying the assignment's "Admin model" requirement without
// duplicating the underlying table.

const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const Admin = sequelize.define('Admin', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:      { type: DataTypes.STRING },
  firstName: { type: DataTypes.STRING, allowNull: true },
  lastName:  { type: DataTypes.STRING, allowNull: true },
  email:     { type: DataTypes.STRING, allowNull: false, unique: true },
  password:  { type: DataTypes.STRING, allowNull: false },
  role:      { type: DataTypes.ENUM('user', 'manager', 'admin'), defaultValue: 'admin' },
  theme:     { type: DataTypes.STRING, defaultValue: 'light' },
}, {
  tableName:  'users',      // shares the users table — filtered by role='admin' in queries
  timestamps: false,
  defaultScope: {
    where: { role: 'admin' },
  },
});

module.exports = Admin;
