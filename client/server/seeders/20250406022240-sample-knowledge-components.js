'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const grade3Components = [
      {
        name: 'Numbers up to 10,000',
        description: 'Reading and writing numbers up to 10,000 in symbols and in words',
        curriculum_code: 'G3-NS-1',
        grade_level: 3,
        prerequisites: JSON.stringify([]), // Assuming no prerequisites for this basic one
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Place Values',
        description: 'Visualizing and identifying place values of numbers up to 10,000',
        curriculum_code: 'G3-NS-2',
        grade_level: 3,
        prerequisites: JSON.stringify(['G3-NS-1']), // Example prerequisite
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Addition of Whole Numbers',
        description: 'Adding whole numbers including money with sums up to 10,000',
        curriculum_code: 'G3-NS-3',
        grade_level: 3,
        prerequisites: JSON.stringify(['G3-NS-2']), // Example prerequisite
        createdAt: new Date(),
        updatedAt: new Date()
      }
      // Add more components as needed
    ];
    await queryInterface.bulkInsert('knowledge_components', grade3Components, {});
  },

  async down (queryInterface, Sequelize) {
    // Delete only the specific components added
    await queryInterface.bulkDelete('knowledge_components', {
      curriculum_code: { [Sequelize.Op.in]: ['G3-NS-1', 'G3-NS-2', 'G3-NS-3'] }
    }, {});
    // Or delete all:
    // await queryInterface.bulkDelete('knowledge_components', null, {});
  }
};
