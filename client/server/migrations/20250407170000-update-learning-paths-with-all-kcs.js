'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Get all students
    const students = await queryInterface.sequelize.query(
      `SELECT id, grade_level FROM students`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // 2. For each student, update their learning path to include ALL knowledge components
    for (const student of students) {
      // Get all knowledge components appropriate for the student's grade level
      // Note: By default, include all KCs if they don't have grade specificity
      const kcs = await queryInterface.sequelize.query(
        `SELECT id FROM knowledge_components WHERE 
         grade_level IS NULL OR grade_level = :grade_level OR 
         (metadata->>'source' = 'pdf')`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { grade_level: student.grade_level }
        }
      );

      // Get the student's current learning path
      const learningPaths = await queryInterface.sequelize.query(
        `SELECT id, sequence FROM learning_paths WHERE student_id = :student_id AND status = 'active'`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { student_id: student.id }
        }
      );

      if (learningPaths.length > 0) {
        const learningPath = learningPaths[0];
        
        // Create a set of existing KC IDs for quick lookup
        let existingKcIds = new Set();
        const sequence = learningPath.sequence || [];
        sequence.forEach(item => {
          if (item && item.knowledge_component_id) {
            existingKcIds.add(item.knowledge_component_id);
          }
        });

        // Add new KCs to the sequence
        let updatedSequence = [...sequence];
        kcs.forEach(kc => {
          if (!existingKcIds.has(kc.id)) {
            updatedSequence.push({
              knowledge_component_id: kc.id,
              status: 'pending'
            });
          }
        });

        // Update the learning path
        await queryInterface.sequelize.query(
          `UPDATE learning_paths SET sequence = :sequence WHERE id = :id`,
          {
            replacements: { 
              sequence: JSON.stringify(updatedSequence), 
              id: learningPath.id 
            },
            type: queryInterface.sequelize.QueryTypes.UPDATE
          }
        );
      } else {
        // If no learning path exists, create one with ALL KCs
        const newSequence = kcs.map(kc => ({
          knowledge_component_id: kc.id,
          status: 'pending'
        }));

        await queryInterface.sequelize.query(
          `INSERT INTO learning_paths (student_id, sequence, status, "createdAt", "updatedAt")
           VALUES (:student_id, :sequence, 'active', NOW(), NOW())`,
          {
            replacements: { 
              student_id: student.id, 
              sequence: JSON.stringify(newSequence) 
            },
            type: queryInterface.sequelize.QueryTypes.INSERT
          }
        );
      }
    }

    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    // No need for a down migration as this is a data enhancement
    return Promise.resolve();
  }
};
