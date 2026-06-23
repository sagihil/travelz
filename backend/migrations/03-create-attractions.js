'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attractions', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:        { type: Sequelize.STRING, allowNull: false },
      city:        { type: Sequelize.STRING },
      country:     { type: Sequelize.STRING },
      category:    { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      rating:      { type: Sequelize.FLOAT },
      imageUrl:    { type: Sequelize.STRING }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('attractions');
  }
};
