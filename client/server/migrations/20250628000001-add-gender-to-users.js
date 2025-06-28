'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add gender field to students table
    await queryInterface.addColumn('students', 'gender', {
      type: Sequelize.ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
      allowNull: true
    });

    // Add gender field to teachers table
    await queryInterface.addColumn('teachers', 'gender', {
      type: Sequelize.ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove gender field from students table
    await queryInterface.removeColumn('students', 'gender');
    
    // Remove gender field from teachers table
    await queryInterface.removeColumn('teachers', 'gender');

    // Drop the enum type (this will only work if no other tables use it)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_gender";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_teachers_gender";');
  }
};