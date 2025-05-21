'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Fetch the actual IDs of the KCs based on curriculum_code for robustness
    const kcs = await queryInterface.sequelize.query(
      `SELECT id, curriculum_code FROM knowledge_components WHERE curriculum_code IN ('G3-NS-1', 'G3-NS-2', 'G3-NS-3')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create a map for easy lookup
    const kcIdMap = kcs.reduce((acc, kc) => {
      acc[kc.curriculum_code] = kc.id;
      return acc;
    }, {});

    const kc1Id = kcIdMap['G3-NS-1'];
    const kc2Id = kcIdMap['G3-NS-2'];
    const kc3Id = kcIdMap['G3-NS-3'];

    // Check if all required KCs were found
    if (!kc1Id || !kc2Id || !kc3Id) {
      throw new Error('Could not find required Knowledge Components (G3-NS-1, G3-NS-2, G3-NS-3) by curriculum_code. Ensure the KC seeder ran successfully.');
    }
    // --- Commented out to prevent conflicts with the newer 'replace-kcs-and-cis' seeder ---
    // This seeder attempts to insert CIs linked to KCs that are deleted by the newer seeder.
    // console.log('Skipping insertion in 20250406022505-sample-content-items.js');
    /*
    await queryInterface.bulkInsert('content_items', [
      {
        type: 'question', // Example type
        content: 'What is the number 5,678 written in words?',
        metadata: JSON.stringify({ answer: 'Five thousand, six hundred seventy-eight', options: [] }),
        difficulty: 2,
        knowledge_component_id: kc1Id, // Linked to 'Numbers up to 10,000'
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'In the number 9,423, what digit is in the hundreds place?',
        metadata: JSON.stringify({ answer: '4', options: ['9', '4', '2', '3'] }),
        difficulty: 3,
        knowledge_component_id: kc2Id, // Linked to 'Place Values'
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 1,234 + 567?',
        metadata: JSON.stringify({ answer: '1801', options: [] }),
        difficulty: 3,
        knowledge_component_id: kc3Id, // Linked to 'Addition'
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
    */
  },

  async down (queryInterface, Sequelize) {
    // Fetch the actual IDs of the KCs based on curriculum_code for robust deletion
     const kcs = await queryInterface.sequelize.query(
      `SELECT id FROM knowledge_components WHERE curriculum_code IN ('G3-NS-1', 'G3-NS-2', 'G3-NS-3')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const kcIds = kcs.map(kc => kc.id);

    // Delete items linked to the specific KCs using their actual IDs
    if (kcIds.length > 0) {
      await queryInterface.bulkDelete('content_items', {
         knowledge_component_id: { [Sequelize.Op.in]: kcIds }
      }, {});
    }
    // Or delete all:
    // await queryInterface.bulkDelete('content_items', null, {});
  }
};
