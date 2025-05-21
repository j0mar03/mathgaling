'use strict';

// Helper function (kept for reference, but not used in the modified 'up' function)
const createMcMetadata = (choices, answer, explanation = '', hint = '') => {
  return JSON.stringify({ choices, answer, explanation, hint });
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // --- Seeder Skipped ---
    // This seeder is intentionally skipped to prevent foreign key conflicts
    // caused by its reliance on hardcoded Knowledge Component IDs (1, 2)
    // which are deleted by the '20250411111113-replace-kcs-and-cis.js' seeder.
    console.log('Skipping execution of 20250406054353-seed-grade3-add-sub-questions.js entirely.');
    return Promise.resolve(); // Indicate successful (empty) execution
  },

  async down (queryInterface, Sequelize) {
     // Original down logic kept for potential future use if seeder is re-enabled
     const kcAddId = 1;
     const kcSubId = 2;
     await queryInterface.bulkDelete('content_items', {
       knowledge_component_id: {
         [Sequelize.Op.in]: [kcAddId, kcSubId]
       },
       teacher_id: null // Attempt to only delete seeded items
     }, {});
     console.log('Executed down function for 20250406054353 (attempted to delete items linked to KC 1 & 2).');
  }
};
