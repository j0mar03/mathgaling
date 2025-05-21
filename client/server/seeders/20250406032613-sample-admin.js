'use strict';
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Same as in authController

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password', SALT_ROUNDS);

    await queryInterface.bulkInsert('Admins', [{ // Use the exact table name from migration
      name: 'Default Admin',
      auth_id: 'admin@example.com', // Use email format for consistency
      password: hashedPassword,
      created_at: new Date(), // Use underscored names if model/migration uses them
      updated_at: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Admins', { auth_id: 'admin@example.com' }, {}); // Use the exact table name
  }
};
