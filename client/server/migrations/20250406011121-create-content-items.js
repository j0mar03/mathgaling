'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('content_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB, // Use JSONB for PostgreSQL
        allowNull: true
      },
      difficulty: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      knowledge_component_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Or false if required
        references: {
          model: 'knowledge_components', // Table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Or CASCADE/RESTRICT depending on desired behavior
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'English',
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('content_items');
  }
};
