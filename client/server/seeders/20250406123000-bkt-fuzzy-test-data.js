'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const testStudentIds = [99901, 99902, 99903];
    const testKcId = 99901;
    const testContentItemIds = [99901, 99902, 99903, 99904];
    const now = new Date();

    // --- Delete existing test data first to prevent unique constraint errors ---
    console.log('Deleting existing BKT/Fuzzy test data...');
    // Delete in reverse order of dependency
    await queryInterface.bulkDelete('responses', { student_id: testStudentIds, content_item_id: testContentItemIds }, {});
    await queryInterface.bulkDelete('knowledge_states', { student_id: testStudentIds, knowledge_component_id: testKcId }, {});
    await queryInterface.bulkDelete('content_items', { id: testContentItemIds }, {});
    await queryInterface.bulkDelete('knowledge_components', { id: testKcId }, {});
    await queryInterface.bulkDelete('students', { id: testStudentIds }, {});
    console.log('Finished deleting existing BKT/Fuzzy test data.');
    // --- End Deletion ---

    // IMPORTANT: Passwords should ideally be hashed using the application's hashing mechanism
    // before seeding. Using plain text here for simplicity.
    await queryInterface.bulkInsert('students', [
      { id: testStudentIds[0], name: 'BKT_A Test', password: 'password_needs_hashing', createdAt: now, updatedAt: now },
      { id: testStudentIds[1], name: 'BKT_B Test', password: 'password_needs_hashing', createdAt: now, updatedAt: now },
      { id: testStudentIds[2], name: 'BKT_C Test', password: 'password_needs_hashing', createdAt: now, updatedAt: now },
    ], {});

    await queryInterface.bulkInsert('knowledge_components', [
      { id: testKcId, name: 'BKT/Fuzzy Test KC 1', description: 'Test KC for BKT/Fuzzy Logic', createdAt: now, updatedAt: now },
    ], {});

    await queryInterface.bulkInsert('content_items', [
      { id: testContentItemIds[0], knowledge_component_id: testKcId, difficulty: 0.5, createdAt: now, updatedAt: now },
      { id: testContentItemIds[1], knowledge_component_id: testKcId, difficulty: 0.5, createdAt: now, updatedAt: now },
      { id: testContentItemIds[2], knowledge_component_id: testKcId, difficulty: 0.5, createdAt: now, updatedAt: now },
      { id: testContentItemIds[3], knowledge_component_id: testKcId, difficulty: 0.5, createdAt: now, updatedAt: now },
    ], {});

    // Initial knowledge states (assuming starting level of 0.5)
    await queryInterface.bulkInsert('knowledge_states', [
      { student_id: testStudentIds[0], knowledge_component_id: testKcId, createdAt: now, updatedAt: now },
      { student_id: testStudentIds[1], knowledge_component_id: testKcId, createdAt: now, updatedAt: now },
      { student_id: testStudentIds[2], knowledge_component_id: testKcId, createdAt: now, updatedAt: now },
    ], {});

    // Responses simulating different scenarios
    // Timestamps are slightly offset to create a clear sequence
    await queryInterface.bulkInsert('responses', [
      // Scenario A (Student 99901 - Mastery, quick answers)
      { student_id: testStudentIds[0], content_item_id: testContentItemIds[0], correct: true, time_spent: 10, createdAt: new Date(now.getTime() + 1000), updatedAt: new Date(now.getTime() + 1000) },
      { student_id: testStudentIds[0], content_item_id: testContentItemIds[1], correct: true, time_spent: 8, createdAt: new Date(now.getTime() + 2000), updatedAt: new Date(now.getTime() + 2000) },
      { student_id: testStudentIds[0], content_item_id: testContentItemIds[2], correct: true, time_spent: 12, createdAt: new Date(now.getTime() + 3000), updatedAt: new Date(now.getTime() + 3000) },
      { student_id: testStudentIds[0], content_item_id: testContentItemIds[3], correct: true, time_spent: 9, createdAt: new Date(now.getTime() + 4000), updatedAt: new Date(now.getTime() + 4000) },

      // Scenario B (Student 99902 - Struggling, slower answers)
      { student_id: testStudentIds[1], content_item_id: testContentItemIds[0], correct: false, time_spent: 45, createdAt: new Date(now.getTime() + 5000), updatedAt: new Date(now.getTime() + 5000) },
      { student_id: testStudentIds[1], content_item_id: testContentItemIds[1], correct: false, time_spent: 55, createdAt: new Date(now.getTime() + 6000), updatedAt: new Date(now.getTime() + 6000) },
      { student_id: testStudentIds[1], content_item_id: testContentItemIds[2], correct: true, time_spent: 60, createdAt: new Date(now.getTime() + 7000), updatedAt: new Date(now.getTime() + 7000) }, // Slow correct
      { student_id: testStudentIds[1], content_item_id: testContentItemIds[3], correct: false, time_spent: 50, createdAt: new Date(now.getTime() + 8000), updatedAt: new Date(now.getTime() + 8000) },

      // Scenario C (Student 99903 - Slip/Guess, moderate speed)
      { student_id: testStudentIds[2], content_item_id: testContentItemIds[0], correct: true, time_spent: 15, createdAt: new Date(now.getTime() + 9000), updatedAt: new Date(now.getTime() + 9000) },
      { student_id: testStudentIds[2], content_item_id: testContentItemIds[1], correct: true, time_spent: 18, createdAt: new Date(now.getTime() + 10000), updatedAt: new Date(now.getTime() + 10000) },
      { student_id: testStudentIds[2], content_item_id: testContentItemIds[2], correct: false, time_spent: 25, createdAt: new Date(now.getTime() + 11000), updatedAt: new Date(now.getTime() + 11000) }, // Slip
      { student_id: testStudentIds[2], content_item_id: testContentItemIds[3], correct: true, time_spent: 20, createdAt: new Date(now.getTime() + 12000), updatedAt: new Date(now.getTime() + 12000) },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    const testStudentIds = [99901, 99902, 99903];
    const testKcId = 99901;
    const testContentItemIds = [99901, 99902, 99903, 99904];

    // Delete in reverse order of insertion due to foreign key constraints
    await queryInterface.bulkDelete('responses', {
      student_id: testStudentIds,
      content_item_id: testContentItemIds
    }, {});

    await queryInterface.bulkDelete('knowledge_states', {
      student_id: testStudentIds,
      knowledge_component_id: testKcId
    }, {});

    await queryInterface.bulkDelete('content_items', {
      id: testContentItemIds
    }, {});

    await queryInterface.bulkDelete('knowledge_components', {
      id: testKcId
    }, {});

    await queryInterface.bulkDelete('students', {
      id: testStudentIds
    }, {});
  }
};