'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get all students
    const students = await queryInterface.sequelize.query(
      'SELECT id FROM students LIMIT 5;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Get all knowledge components
    const knowledgeComponents = await queryInterface.sequelize.query(
      'SELECT id FROM knowledge_components LIMIT 20;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (students.length === 0 || knowledgeComponents.length === 0) {
      console.log('No students or knowledge components found, skipping seed');
      return;
    }
    
    // Create learning paths for each student if they don't already exist
    const now = new Date();
    const learningPaths = [];
    
    for (const student of students) {
      // Check if this student already has a learning path
      const existingPath = await queryInterface.sequelize.query(
        'SELECT id FROM learning_paths WHERE student_id = ?;',
        { 
          replacements: [student.id],
          type: Sequelize.QueryTypes.SELECT 
        }
      );
      
      if (existingPath.length === 0) {
        learningPaths.push({
          student_id: student.id,
          status: 'active',
          sequence: JSON.stringify([]), // Empty sequence for now
          createdAt: now,
          updatedAt: now
        });
      }
    }
    
    if (learningPaths.length > 0) {
      await queryInterface.bulkInsert('learning_paths', learningPaths);
    }
    
    // Get the IDs of the learning paths we just created
    const paths = await queryInterface.sequelize.query(
      'SELECT id, student_id FROM learning_paths;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Create learning path components for each path - using ALL knowledge components
    const pathComponents = [];
    
    for (const path of paths) {
      // Instead of random, use ALL available knowledge components
      // This ensures each path has content from every knowledge component
      for (let i = 0; i < knowledgeComponents.length; i++) {
        pathComponents.push({
          learning_path_id: path.id,
          knowledge_component_id: knowledgeComponents[i].id,
          position: i + 1,
          is_completed: i < 2, // First two are completed for demo
          completed_at: i < 2 ? now : null,
          createdAt: now,
          updatedAt: now
        });
      }
      
      console.log(`Added ${knowledgeComponents.length} components to learning path for student ${path.student_id}`);
    }
    
    if (pathComponents.length > 0) {
      // Use try-catch to handle possible duplicate records
      try {
        await queryInterface.bulkInsert('LearningPathComponents', pathComponents);
      } catch (error) {
        console.log('Some learning path components already exist, skipping duplicates');
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove all learning path components
    await queryInterface.bulkDelete('LearningPathComponents', null, {});
    
    // We won't delete the learning paths themselves, as they might be referenced elsewhere
  }
};
