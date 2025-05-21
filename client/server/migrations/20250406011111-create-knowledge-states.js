'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('knowledge_states', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students', // Name of the referenced table
          key: 'id'
        },
        onUpdate: 'CASCADE', // Optional: Specify behavior on update/delete
        onDelete: 'CASCADE'  // Optional: Specify behavior on update/delete
      },
      knowledge_component_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'knowledge_components', // Name of the referenced table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      p_mastery: {
        type: Sequelize.FLOAT, // Use FLOAT for REAL
        defaultValue: 0.3,
        allowNull: false
      },
      p_transit: {
        type: Sequelize.FLOAT,
        defaultValue: 0.1,
        allowNull: false
      },
      p_guess: {
        type: Sequelize.FLOAT,
        defaultValue: 0.2,
        allowNull: false
      },
      p_slip: {
        type: Sequelize.FLOAT,
        defaultValue: 0.1,
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
    await queryInterface.dropTable('knowledge_states');
  }
};
