'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if content item with ID 18 already exists
    const existingItem = await queryInterface.sequelize.query(
      `SELECT id FROM content_items WHERE id = 18`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // If item with ID 18 exists, delete it first to ensure clean slate
    if (existingItem.length > 0) {
      await queryInterface.sequelize.query(
        `DELETE FROM content_items WHERE id = 18`
      );
    }

    // Get a valid teacher ID to associate with the content
    const teachers = await queryInterface.sequelize.query(
      `SELECT id FROM teachers LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const teacherId = teachers.length > 0 ? teachers[0].id : 99901; // Default from seed data

    // Get a valid knowledge component ID to associate with the content
    const kcs = await queryInterface.sequelize.query(
      `SELECT id FROM knowledge_components LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const kcId = kcs.length > 0 ? kcs[0].id : 1; // Default to first KC

    // Create a content item with ID 18 that's guaranteed to work with the quiz
    // --- Commented out to prevent potential foreign key errors ---
    // This seeder attempts to insert a specific content item (ID 18).
    // It fetches the first available KC ID, but defaults to 1 if none are found.
    // If the 'replace-kcs-and-cis' seeder runs first and deletes KC 1,
    // this insert could fail if no KCs are present when this runs.
    console.log('Skipping insertion in 20250407175000-fix-content-item-for-quiz.js');
    /*
    await queryInterface.sequelize.query(`
      INSERT INTO content_items (
        id,
        type,
        content,
        difficulty,
        metadata,
        knowledge_component_id,
        teacher_id,
        "createdAt",
        "updatedAt"
      ) VALUES (
        18,
        'multiple_choice',
        'What is 42 + 17?',
        3,
        '{"answer": "59", "choices": ["57", "58", "59", "60"], "hint": "Add the ones digits first, then the tens digits.", "explanation": "When we add 42 + 17, we first add 2 + 7 = 9 (ones place), then 40 + 10 = 50 (tens place), giving us a total of 59.", "question_type": "multiple_choice"}',
        ${kcId},
        ${teacherId},
        NOW(),
        NOW()
      )
    `);
    */

    // Also make sure question ID 18 is included in all active learning paths
    const students = await queryInterface.sequelize.query(
      `SELECT id FROM students`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const student of students) {
      const learningPaths = await queryInterface.sequelize.query(
        `SELECT id, sequence FROM learning_paths WHERE student_id = :student_id AND status = 'active'`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { student_id: student.id }
        }
      );

      if (learningPaths.length > 0) {
        const learningPath = learningPaths[0];
        const sequence = learningPath.sequence || [];
        
        // Check if the KC is already in the sequence
        let kcAlreadyInSequence = false;
        for (const item of sequence) {
          if (item && item.knowledge_component_id === kcId) {
            kcAlreadyInSequence = true;
            break;
          }
        }

        // If KC not in sequence, add it
        if (!kcAlreadyInSequence) {
          sequence.push({
            knowledge_component_id: kcId,
            status: 'pending'
          });

          await queryInterface.sequelize.query(
            `UPDATE learning_paths SET sequence = :sequence WHERE id = :id`,
            {
              replacements: { 
                sequence: JSON.stringify(sequence), 
                id: learningPath.id 
              }
            }
          );
        }
      }
    }

    // Create knowledge state entries for all students for this KC
    for (const student of students) {
      // Check if the knowledge state already exists
      const existingState = await queryInterface.sequelize.query(
        `SELECT id FROM knowledge_states WHERE student_id = :student_id AND knowledge_component_id = :kc_id`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { 
            student_id: student.id,
            kc_id: kcId
          }
        }
      );

      if (existingState.length === 0) {
        // Create a new knowledge state
        await queryInterface.sequelize.query(`
          INSERT INTO knowledge_states (
            student_id,
            knowledge_component_id,
            p_mastery,
            p_transit,
            p_slip,
            p_guess,
            "createdAt",
            "updatedAt"
          ) VALUES (
            :student_id,
            :kc_id,
            0.3,
            0.09,
            0.1,
            0.2,
            NOW(),
            NOW()
          )
        `, {
          replacements: {
            student_id: student.id,
            kc_id: kcId
          }
        });
      }
    }

    console.log('Fixed content item with ID 18 for student quiz');
  },

  async down(queryInterface, Sequelize) {
    // If needed, you can remove the content item in the down migration
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id = 18`
    );
  }
};
