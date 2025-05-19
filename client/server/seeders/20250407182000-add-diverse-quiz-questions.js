'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all knowledge components
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name, grade_level FROM knowledge_components`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('No knowledge components found, cannot create questions');
      return;
    }

    // Get all teachers for assigning content
    const teachers = await queryInterface.sequelize.query(
      `SELECT id FROM teachers LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const teacherId = teachers.length > 0 ? teachers[0].id : 99901; // Default from seed data

    // Create diverse quiz questions for each knowledge component
    let contentId = 100; // Start with a high ID to avoid conflicts
    
    // Define an array of math questions with proper metadata
    const quizQuestions = [
      {
        content: 'What is 15 + 23?',
        type: 'multiple_choice',
        difficulty: 2,
        metadata: {
          answer: '38',
          choices: ['36', '37', '38', '39'],
          hint: 'Add the ones, then the tens',
          explanation: 'To add 15 + 23, first add 5 + 3 = 8 (ones), then 10 + 20 = 30 (tens). 30 + 8 = 38.',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'What is 72 - 47?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '25',
          choices: ['15', '25', '35', '45'],
          hint: 'Subtract the ones first, then the tens',
          explanation: 'To subtract 72 - 47, first 12 - 7 = 5 (ones), then 60 - 40 = 20 (tens). 20 + 5 = 25.',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'What is 6 × 8?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '48',
          choices: ['42', '48', '54', '56'],
          hint: 'Think of it as 6 groups of 8 or 8 groups of 6',
          explanation: 'Multiplication means repeated addition. 6 × 8 = 6 + 6 + 6 + 6 + 6 + 6 + 6 + 6 = 48',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'What is 56 ÷ 7?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '8',
          choices: ['6', '7', '8', '9'],
          hint: 'Division means finding how many groups of 7 can be made from 56',
          explanation: '56 ÷ 7 = 8 because 7 × 8 = 56',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'What is the area of a rectangle with length 7 cm and width 4 cm?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '28 cm²',
          choices: ['11 cm²', '22 cm²', '28 cm²', '32 cm²'],
          hint: 'Area of a rectangle = length × width',
          explanation: 'Area of rectangle = length × width = 7 cm × 4 cm = 28 cm²',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'What is the perimeter of a square with side length 5 cm?',
        type: 'multiple_choice',
        difficulty: 2,
        metadata: {
          answer: '20 cm',
          choices: ['10 cm', '15 cm', '20 cm', '25 cm'],
          hint: 'Perimeter means the sum of all sides',
          explanation: 'Perimeter of square = 4 × side length = 4 × 5 cm = 20 cm',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'Which fraction is equivalent to 2/4?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '1/2',
          choices: ['1/4', '1/2', '2/3', '3/4'],
          hint: 'Simplify by dividing both numerator and denominator by their greatest common factor',
          explanation: '2/4 can be simplified by dividing both numbers by 2: 2÷2/4÷2 = 1/2',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'If a recipe calls for 3/4 cup of flour and you want to make half a recipe, how much flour do you need?',
        type: 'multiple_choice',
        difficulty: 4,
        metadata: {
          answer: '3/8 cup',
          choices: ['1/4 cup', '3/8 cup', '1/2 cup', '5/8 cup'],
          hint: 'Multiply 3/4 by 1/2',
          explanation: 'Half of 3/4 means 3/4 × 1/2 = 3/8 cup',
          question_type: 'multiple_choice'
        }
      }
    ];

    // Create quiz questions for each knowledge component
    const contentItemsToCreate = [];
    
    for (const kc of knowledgeComponents) {
      // Create 2 random questions per knowledge component
      for (let i = 0; i < 2; i++) {
        const randomQuestionIndex = Math.floor(Math.random() * quizQuestions.length);
        const question = quizQuestions[randomQuestionIndex];
        
        contentItemsToCreate.push({
          id: contentId++,
          type: question.type,
          content: question.content,
          difficulty: question.difficulty,
          metadata: JSON.stringify(question.metadata),
          knowledge_component_id: kc.id,
          teacher_id: teacherId,
          "createdAt": new Date(),
          "updatedAt": new Date()
        });
      }
    }

    // Insert all content items in a single transaction
    if (contentItemsToCreate.length > 0) {
      // --- Commented out to prevent conflicts with the newer 'replace-kcs-and-cis' seeder ---
      // This seeder dynamically creates CIs for *all* KCs found, which can conflict
      // when the 'replace' seeder deletes old KCs later in the process.
      console.log('Skipping insertion in 20250407182000-add-diverse-quiz-questions.js');
      // await queryInterface.bulkInsert('content_items', contentItemsToCreate);
      // console.log(`Created ${contentItemsToCreate.length} diverse quiz questions`);
    }

    // Make sure all students have knowledge states for all KCs
    const students = await queryInterface.sequelize.query(
      `SELECT id FROM students`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const knowledgeStatesToCreate = [];
    let stateCount = 0;

    for (const student of students) {
      for (const kc of knowledgeComponents) {
        // Check if knowledge state already exists
        const existingState = await queryInterface.sequelize.query(
          `SELECT id FROM knowledge_states 
           WHERE student_id = :student_id AND knowledge_component_id = :kc_id`,
          {
            type: queryInterface.sequelize.QueryTypes.SELECT,
            replacements: {
              student_id: student.id,
              kc_id: kc.id
            }
          }
        );

        if (existingState.length === 0) {
          knowledgeStatesToCreate.push({
            student_id: student.id,
            knowledge_component_id: kc.id,
            p_mastery: 0.3,
            p_transit: 0.09,
            p_slip: 0.1,
            p_guess: 0.2,
            "createdAt": new Date(),
            "updatedAt": new Date()
          });
          stateCount++;
        }
      }
    }

    // Insert all knowledge states in a single transaction
    if (knowledgeStatesToCreate.length > 0) {
      await queryInterface.bulkInsert('knowledge_states', knowledgeStatesToCreate);
      console.log(`Created ${stateCount} knowledge states`);
    }

    // Make sure all students have all KCs in their learning paths
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
        let updated = false;
        
        // Set of KC IDs already in the sequence
        const existingKcIds = new Set();
        sequence.forEach(item => {
          if (item && item.knowledge_component_id) {
            existingKcIds.add(item.knowledge_component_id);
          }
        });

        // Add missing KCs to the sequence
        const updatedSequence = [...sequence];
        for (const kc of knowledgeComponents) {
          if (!existingKcIds.has(kc.id)) {
            updatedSequence.push({
              knowledge_component_id: kc.id,
              status: 'pending'
            });
            updated = true;
          }
        }

        if (updated) {
          await queryInterface.sequelize.query(
            `UPDATE learning_paths SET sequence = :sequence WHERE id = :id`,
            {
              replacements: {
                sequence: JSON.stringify(updatedSequence),
                id: learningPath.id
              }
            }
          );
        }
      }
    }

    console.log('Successfully created diverse quiz questions and learning paths');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 100 AND id < 200`
    );
  }
};
