'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await Promise.all([
      queryInterface.addColumn('students', 'password', {
        type: Sequelize.STRING,
        allowNull: true, // Allow NULL initially
      }),
      queryInterface.addColumn('teachers', 'password', {
        type: Sequelize.STRING,
        allowNull: true, // Allow NULL initially
      }),
      queryInterface.addColumn('parents', 'password', {
        type: Sequelize.STRING,
        allowNull: true, // Allow NULL initially
      }),
    ]);

    // Note: We are leaving allowNull: true for now.
    // The application logic should handle prompting users
    // with null passwords to set one.
    // If we wanted to enforce NOT NULL later, we would first need to
    // update all existing rows to have a non-null password, then run:
    // await queryInterface.changeColumn('students', 'password', { type: Sequelize.STRING, allowNull: false });
    // await queryInterface.changeColumn('teachers', 'password', { type: Sequelize.STRING, allowNull: false });
    // await queryInterface.changeColumn('parents', 'password', { type: Sequelize.STRING, allowNull: false });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await Promise.all([
      queryInterface.removeColumn('students', 'password'),
      queryInterface.removeColumn('teachers', 'password'),
      queryInterface.removeColumn('parents', 'password'),
    ]);
  }
};
