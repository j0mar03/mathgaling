'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('content_items', 'teacher_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null for content potentially created by admins or system
      references: {
        model: 'teachers', // Name of the target table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Or 'CASCADE' if CIs should be deleted when teacher is deleted
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('content_items', 'teacher_id');
  }
};
