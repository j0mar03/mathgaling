'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      from_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      from_user_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      to_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      to_user_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sent_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('messages');
  }
}; 