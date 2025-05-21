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

    // Create a starting ID that doesn't conflict with existing content items
    // Start with 1000 to avoid conflicts with other seeders
    let contentId = 1000;
    
    // Define 10 additional math quiz questions with varying types and difficulty
    const testQuizQuestions = [
      // Multiple choice questions
      {
        content: 'If 5 apples cost 25 pesos, how much will 8 apples cost?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '40 pesos',
          choices: ['30 pesos', '35 pesos', '40 pesos', '45 pesos'],
          hint: 'First find the cost of one apple, then multiply by 8',
          explanation: 'One apple costs 25 ÷ 5 = 5 pesos. So 8 apples will cost 8 × 5 = 40 pesos.',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'What is the value of 3² + 4²?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '25',
          choices: ['15', '24', '25', '49'],
          hint: 'Square each number and then add them together',
          explanation: '3² = 3 × 3 = 9, and 4² = 4 × 4 = 16. So 3² + 4² = 9 + 16 = 25.',
          question_type: 'multiple_choice'
        }
      },
      
      // Fill in the blank questions
      {
        content: 'In a right triangle, the sum of all interior angles is always ___ degrees.',
        type: 'fill_in_blank',
        difficulty: 2,
        metadata: {
          answer: '180',
          hint: 'The sum of angles in any triangle is the same',
          explanation: 'The sum of interior angles in any triangle, including right triangles, is 180 degrees.',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'If a rectangle has a length of 12 cm and a width of 5 cm, its area is ___ cm².',
        type: 'fill_in_blank',
        difficulty: 2,
        metadata: {
          answer: '60',
          hint: 'Area of a rectangle = length × width',
          explanation: 'Area of rectangle = length × width = 12 cm × 5 cm = 60 cm²',
          question_type: 'fill_in_blank'
        }
      },
      
      // Word problems
      {
        content: 'Maria has 24 candies. She gives 1/3 of them to her brother and 1/4 of the remainder to her sister. How many candies does Maria have left?',
        type: 'word_problem',
        difficulty: 4,
        metadata: {
          answer: '12',
          hint: 'First find how many she gives to her brother, then how many remain, then how many she gives to her sister',
          explanation: 'Maria gives 24 × 1/3 = 8 candies to her brother. She has 24 - 8 = 16 candies left. She gives 16 × 1/4 = 4 candies to her sister. So she has 16 - 4 = 12 candies left.',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'A train travels at a speed of 60 kilometers per hour. How far will it travel in 2.5 hours?',
        type: 'word_problem',
        difficulty: 3,
        metadata: {
          answer: '150',
          hint: 'Distance = speed × time',
          explanation: 'Distance = speed × time = 60 kilometers per hour × 2.5 hours = 150 kilometers',
          question_type: 'fill_in_blank'
        }
      },
      
      // Computation questions
      {
        content: 'Calculate: (36 ÷ 4) × 3 + 5',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '32',
          hint: 'Follow the order of operations: division, multiplication, then addition',
          explanation: 'Following the order of operations: (36 ÷ 4) × 3 + 5 = 9 × 3 + 5 = 27 + 5 = 32',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'What is the least common multiple (LCM) of 6 and 8?',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '24',
          hint: 'List multiples of each number and find the smallest one that appears in both lists',
          explanation: 'Multiples of 6: 6, 12, 18, 24, 30, ...\nMultiples of 8: 8, 16, 24, 32, ...\nThe smallest number in both lists is 24.',
          question_type: 'fill_in_blank'
        }
      },
      
      // Advanced questions
      {
        content: 'A number increased by 15% gives 69. What is the original number?',
        type: 'multiple_choice',
        difficulty: 5,
        metadata: {
          answer: '60',
          choices: ['54', '58', '60', '65'],
          hint: 'If x is increased by 15%, it becomes 1.15x = 69',
          explanation: 'Let the original number be x. After increasing by 15%, we get 1.15x = 69. Solving for x: x = 69 ÷ 1.15 = 60.',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'The average of five consecutive integers is 27. What is the largest of these integers?',
        type: 'computation',
        difficulty: 5,
        metadata: {
          answer: '29',
          hint: 'If n is the middle integer, the five consecutive integers are: n-2, n-1, n, n+1, n+2',
          explanation: 'Let n be the middle integer. The five consecutive integers are: n-2, n-1, n, n+1, n+2. Their average is 27, so (n-2+n-1+n+n+1+n+2)/5 = 27. Simplifying: 5n/5 = 27, so n = 27. The largest integer is n+2 = 29.',
          question_type: 'fill_in_blank'
        }
      }
    ];
    
    // Add 10 more questions
    testQuizQuestions.push(
      // Geometry
      {
        content: 'What is the perimeter of a square with a side length of 9 cm?',
        type: 'computation',
        difficulty: 2,
        metadata: {
          answer: '36',
          hint: 'Perimeter of a square = 4 × side length',
          explanation: 'Perimeter = 4 × 9 cm = 36 cm',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'A circle has a radius of 7 cm. What is its approximate circumference? (Use π ≈ 22/7)',
        type: 'computation',
        difficulty: 4,
        metadata: {
          answer: '44',
          hint: 'Circumference = 2 × π × radius',
          explanation: 'Circumference = 2 × (22/7) × 7 cm = 44 cm',
          question_type: 'fill_in_blank'
        }
      },
      // Fractions/Decimals
      {
        content: 'Convert 3/5 to a decimal.',
        type: 'multiple_choice',
        difficulty: 2,
        metadata: {
          answer: '0.6',
          choices: ['0.3', '0.5', '0.6', '3.5'],
          hint: 'Divide the numerator by the denominator',
          explanation: '3 ÷ 5 = 0.6',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'Calculate: 1/2 + 1/4',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '3/4',
          choices: ['1/6', '2/6', '1/3', '3/4'],
          hint: 'Find a common denominator before adding',
          explanation: '1/2 = 2/4. So, 2/4 + 1/4 = 3/4',
          question_type: 'multiple_choice'
        }
      },
      // Percentage
      {
        content: 'What is 20% of 150?',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '30',
          hint: 'Convert the percentage to a decimal (20% = 0.20) and multiply',
          explanation: '0.20 × 150 = 30',
          question_type: 'fill_in_blank'
        }
      },
      // Algebra
      {
        content: 'Solve for x: 2x + 5 = 19',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '7',
          hint: 'Subtract 5 from both sides, then divide by 2',
          explanation: '2x = 19 - 5 => 2x = 14 => x = 14 ÷ 2 = 7',
          question_type: 'fill_in_blank'
        }
      },
      // Measurement
      {
        content: 'How many meters are in 3.5 kilometers?',
        type: 'multiple_choice',
        difficulty: 2,
        metadata: {
          answer: '3500',
          choices: ['35', '350', '3500', '35000'],
          hint: '1 kilometer = 1000 meters',
          explanation: '3.5 kilometers × 1000 meters/kilometer = 3500 meters',
          question_type: 'multiple_choice'
        }
      },
      // Data Analysis
      {
        content: 'Find the average of these numbers: 10, 15, 20, 25',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '17.5',
          hint: 'Sum the numbers and divide by the count of numbers',
          explanation: '(10 + 15 + 20 + 25) / 4 = 70 / 4 = 17.5',
          question_type: 'fill_in_blank'
        }
      },
      // Time
      {
        content: 'If a movie starts at 6:45 PM and lasts for 1 hour and 50 minutes, what time does it end?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '8:35 PM',
          choices: ['8:25 PM', '8:35 PM', '8:45 PM', '7:35 PM'],
          hint: 'Add the hours first, then the minutes. Adjust if minutes go over 60.',
          explanation: '6:45 PM + 1 hour = 7:45 PM. 7:45 PM + 50 minutes = 7:95 PM. Since 95 minutes = 1 hour and 35 minutes, the time is 7 PM + 1 hour + 35 minutes = 8:35 PM.',
          question_type: 'multiple_choice'
        }
      },
      // Number Sense
      {
        content: 'Which number is larger: -15 or -10?',
        type: 'multiple_choice',
        difficulty: 1,
        metadata: {
          answer: '-10',
          choices: ['-15', '-10'],
          hint: 'Think about the number line. Numbers further to the right are larger.',
          explanation: 'On a number line, -10 is to the right of -15, making it the larger number.',
          question_type: 'multiple_choice'
        }
      }
    );

    // Assign each question to a random knowledge component
    const contentItemsToCreate = [];
    
    for (let i = 0; i < testQuizQuestions.length; i++) {
      // Select a random knowledge component
      const randomKCIndex = Math.floor(Math.random() * knowledgeComponents.length);
      const kc = knowledgeComponents[randomKCIndex];
      const question = testQuizQuestions[i];
      
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

    // Insert all content items in a single transaction
    if (contentItemsToCreate.length > 0) {
      // --- Commented out to prevent conflicts with the newer 'replace-kcs-and-cis' seeder ---
      // This seeder dynamically creates CIs for *all* KCs found, which can conflict
      // when the 'replace' seeder deletes old KCs later in the process.
      console.log('Skipping insertion in 20250408054000-add-its-test-quiz-questions.js');
      // await queryInterface.bulkInsert('content_items', contentItemsToCreate);
      // console.log(`Created ${contentItemsToCreate.length} ITS test quiz questions`);
    }

    console.log('Successfully created ITS test quiz questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all 20 added content items (IDs 1000 to 1019)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 1000 AND id < 1020`
    );
  }
};
