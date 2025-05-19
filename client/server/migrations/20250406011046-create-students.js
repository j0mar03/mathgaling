'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('students', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      auth_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      grade_level: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      language_preference: {
        type: Sequelize.STRING,
        defaultValue: 'English',
        allowNull: false
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSONB, // Use JSONB for PostgreSQL
        allowNull: true
      },
      favorite_color: {
        type: Sequelize.STRING,
        defaultValue: '#4a90e2',
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default in DB
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default in DB
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('students');
  }
};
