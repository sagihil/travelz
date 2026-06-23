'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_interests', {
      id:         { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId:     { type: Sequelize.INTEGER, allowNull: false,
                    references: { model: 'users',     key: 'id' }, onDelete: 'CASCADE' },
      interestId: { type: Sequelize.INTEGER, allowNull: false,
                    references: { model: 'interests', key: 'id' }, onDelete: 'CASCADE' }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('user_interests');
  }
};
