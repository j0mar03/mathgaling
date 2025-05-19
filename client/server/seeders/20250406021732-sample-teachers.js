'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Delete existing teacher with the same auth_id to prevent unique constraint errors
    await queryInterface.bulkDelete('teachers', {
      auth_id: 'teacher-auth-1'
    }, {});

    await queryInterface.bulkInsert('teachers', [{
      // id: 1, // Removed explicit ID - Let DB auto-generate
      name: 'Sample Teacher',
      auth_id: 'teacher-auth-1', // Example auth ID
      preferences: JSON.stringify({ theme: 'dark' }), // Example preferences
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    // Remove the specific teacher added
    await queryInterface.bulkDelete('teachers', { id: 1 }, {});
    // Or delete all teachers if preferred for rollback:
    // await queryInterface.bulkDelete('teachers', null, {});
  }
};
