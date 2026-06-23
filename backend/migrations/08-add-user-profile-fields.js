'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'firstName', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('users', 'lastName',  { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('users', 'theme',     { type: Sequelize.STRING, defaultValue: 'light' });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'firstName');
    await queryInterface.removeColumn('users', 'lastName');
    await queryInterface.removeColumn('users', 'theme');
  }
};
