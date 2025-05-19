'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LearningPathComponents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      learning_path_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'learning_paths',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      knowledge_component_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'knowledge_components',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Optional ordering position of this KC in the learning path'
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add a composite unique constraint to prevent duplicate entries
    await queryInterface.addConstraint('LearningPathComponents', {
      fields: ['learning_path_id', 'knowledge_component_id'],
      type: 'unique',
      name: 'unique_learning_path_component'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LearningPathComponents');
  }
};
