'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interests', {
      id:   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING,  allowNull: false, unique: true }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('interests');
  }
};
