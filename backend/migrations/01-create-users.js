'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:       { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:     { type: Sequelize.STRING,  allowNull: false },
      email:    { type: Sequelize.STRING,  allowNull: false, unique: true },
      password: { type: Sequelize.STRING,  allowNull: false },
      role:     { type: Sequelize.ENUM('user', 'manager', 'admin'), defaultValue: 'user' }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};
