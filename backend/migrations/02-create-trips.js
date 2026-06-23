'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trips', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId:      { type: Sequelize.INTEGER, allowNull: false,
                     references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:       { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      startDate:   { type: Sequelize.DATEONLY },
      endDate:     { type: Sequelize.DATEONLY }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('trips');
  }
};
