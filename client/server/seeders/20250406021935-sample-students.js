'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Delete existing student with the same auth_id to prevent unique constraint errors
    await queryInterface.bulkDelete('students', {
      auth_id: 'student-auth-1'
    }, {});

    await queryInterface.bulkInsert('students', [{
      // id: 1, // Removed explicit ID - Let DB auto-generate
      name: 'Sample Student',
      auth_id: 'student-auth-1', // Example auth ID
      grade_level: 3, // Example grade level
      language_preference: 'English',
      preferences: JSON.stringify({ avatar: 'robot' }), // Example preferences
      createdAt: new Date(),
      updatedAt: new Date(),
      last_login: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('students', { id: 1 }, {});
    // Or delete all students:
    // await queryInterface.bulkDelete('students', null, {});
  }
};
