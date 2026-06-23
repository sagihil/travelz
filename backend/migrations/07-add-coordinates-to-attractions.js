'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attractions', 'latitude',  { type: Sequelize.FLOAT, allowNull: true });
    await queryInterface.addColumn('attractions', 'longitude', { type: Sequelize.FLOAT, allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('attractions', 'latitude');
    await queryInterface.removeColumn('attractions', 'longitude');
  }
};
