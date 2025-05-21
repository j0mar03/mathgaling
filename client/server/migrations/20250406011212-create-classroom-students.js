'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('classroom_students', {
      classroom_id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        references: {
          model: 'classrooms', // Table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a classroom is deleted, remove the link
      },
      student_id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        references: {
          model: 'students', // Table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a student is deleted, remove the link
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
      // No separate createdAt/updatedAt unless specifically needed for the relationship itself
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('classroom_students');
  }
};
