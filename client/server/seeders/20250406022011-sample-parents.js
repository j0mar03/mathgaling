'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Delete existing parent with the same auth_id to prevent unique constraint errors
    await queryInterface.bulkDelete('parents', {
      auth_id: 'parent-auth-1'
    }, {});

    await queryInterface.bulkInsert('parents', [{
      // id: 1, // Removed explicit ID - Let DB auto-generate
      name: 'Sample Parent',
      auth_id: 'parent-auth-1', // Example auth ID
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('parents', { id: 1 }, {});
    // Or delete all parents:
    // await queryInterface.bulkDelete('parents', null, {});
  }
};
