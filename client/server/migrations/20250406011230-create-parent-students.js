'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('parent_students', {
      parent_id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        references: {
          model: 'parents', // Table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a parent is deleted, remove the link
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
      }
      // No createdAt/updatedAt for this simple junction table
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('parent_students');
  }
};
