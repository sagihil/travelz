'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trip_attractions', {
      id:           { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tripId:       { type: Sequelize.INTEGER, allowNull: false,
                      references: { model: 'trips',       key: 'id' }, onDelete: 'CASCADE' },
      attractionId: { type: Sequelize.INTEGER, allowNull: false,
                      references: { model: 'attractions', key: 'id' }, onDelete: 'CASCADE' },
      dayNumber:    { type: Sequelize.INTEGER },
      orderInDay:   { type: Sequelize.INTEGER },
      notes:        { type: Sequelize.TEXT }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('trip_attractions');
  }
};
