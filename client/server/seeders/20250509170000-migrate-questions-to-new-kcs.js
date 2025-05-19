'use strict';
const db = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    console.log('Starting migration of content items to new KCs...');

    const mappings = [
      // Existing mappings
      { oldKcCurriculumCode: 'G3-M4-KC2-1746775431255', newKcCurriculumCodeSuffix: 'Q1M4-KC10' },
      { oldKcCurriculumCode: 'G3-M2-KC1-1746775431254', newKcCurriculumCodeSuffix: 'Q1M2-KC04' },
      { oldKcCurriculumCode: 'G3-M4-KC1-1746775431255', newKcCurriculumCodeSuffix: 'Q1M4-KC09' },
      { oldKcCurriculumCode: 'G3-M4-KC3-1746775431255', newKcCurriculumCodeSuffix: 'Q1M5-KC11' },
      { oldKcCurriculumCode: 'G3-M1-KC2-1746775431254', newKcCurriculumCodeSuffix: 'Q1M1-KC02' },
      { oldKcCurriculumCode: 'G3-M3-KC2-1746775431255', newKcCurriculumCodeSuffix: 'Q1M3-KC08' },
      // New mappings from user feedback
      { oldKcCurriculumCode: 'G3-M5-KC1-1746775431255', newKcCurriculumCodeSuffix: 'Q1M5-KC12' },
      { oldKcCurriculumCode: 'G3-M5-KC2-1746775431255', newKcCurriculumCodeSuffix: 'Q1M5-KC13' },
      { oldKcCurriculumCode: 'G3-M2-KC2-1746775431254', newKcCurriculumCodeSuffix: 'Q1M2-KC05' },
      { oldKcCurriculumCode: 'G3-M1-KC3-1746775431254', newKcCurriculumCodeSuffix: 'Q1M1-KC03' },
      { oldKcCurriculumCode: 'G3-M1-KC1-1746775431254', newKcCurriculumCodeSuffix: 'Q1M1-KC01' },
      { oldKcCurriculumCode: 'G3-M2-KC3-1746775431255', newKcCurriculumCodeSuffix: 'Q1M2-KC06' },
      { oldKcCurriculumCode: 'G3-M5-KC4-1746775431255', newKcCurriculumCodeSuffix: 'Q1M6-KC15' },
      { oldKcCurriculumCode: 'G3-M5-KC3-1746775431255', newKcCurriculumCodeSuffix: 'Q1M6-KC14' },
      { oldKcCurriculumCode: 'G3-M3-KC1-1746775431255', newKcCurriculumCodeSuffix: 'Q1M3-KC07' },
    ];

    const gradeLevel = 3; // Assuming these are all Grade 3 KCs

    try {
      for (const mapping of mappings) {
        const fullNewKcCurriculumCode = `G${gradeLevel}-${mapping.newKcCurriculumCodeSuffix}`;

        console.log(`Processing mapping: ${mapping.oldKcCurriculumCode} -> ${fullNewKcCurriculumCode}`);

        // Find the old KC
        const oldKc = await db.KnowledgeComponent.findOne({
          where: { curriculum_code: mapping.oldKcCurriculumCode },
          transaction
        });

        // Find the new KC
        const newKc = await db.KnowledgeComponent.findOne({
          where: { curriculum_code: fullNewKcCurriculumCode },
          transaction
        });

        if (oldKc && newKc) {
          console.log(`Found old KC ID: ${oldKc.id} and new KC ID: ${newKc.id}. Migrating content items...`);
          const [results, metadata] = await db.ContentItem.update(
            { knowledge_component_id: newKc.id },
            { where: { knowledge_component_id: oldKc.id }, transaction }
          );
          console.log(`Updated ${results} content items from ${mapping.oldKcCurriculumCode} to ${fullNewKcCurriculumCode}.`);
          if (results === undefined && metadata && metadata.rowCount !== undefined) { // Fallback for some DB dialects
            console.log(`Updated ${metadata.rowCount} content items (using metadata.rowCount).`);
          }
        } else {
          if (!oldKc) {
            console.warn(`Old KC with curriculum_code ${mapping.oldKcCurriculumCode} not found. Skipping this mapping.`);
          }
          if (!newKc) {
            console.warn(`New KC with curriculum_code ${fullNewKcCurriculumCode} not found. Skipping this mapping. Ensure the '20250509100000-seed-grade3-sequential-kcs.js' seeder has been run successfully.`);
          }
        }
      }

      await transaction.commit();
      console.log('Content item migration completed successfully.');
    } catch (error) {
      await transaction.rollback();
      console.error('Error migrating content items:', error);
      throw error; // Re-throw error to indicate seeder failure
    }
  },

  async down (queryInterface, Sequelize) {
    // This down migration is complex as it would require knowing the original KC for each content item.
    // For simplicity, this down migration will not revert the changes.
    // A more robust down migration would store the old KC IDs before updating.
    console.warn('Down migration for content item reassignment is not implemented. Manual reversion may be required.');
    // Example (conceptual, would need original IDs):
    // const transaction = await queryInterface.sequelize.transaction();
    // try {
    //   for (const mapping of mappings) { // 'mappings' would need to be defined here too
    //     // ... find oldKc and newKc ...
    //     // await db.ContentItem.update({ knowledge_component_id: oldKc.id }, { where: { knowledge_component_id: newKc.id }, transaction });
    //   }
    //   await transaction.commit();
    // } catch (error) {
    //   await transaction.rollback();
    //   throw error;
    // }
  }
};
