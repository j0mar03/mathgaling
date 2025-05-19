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
    // Start with 2000 to avoid conflicts with other seeders
    let contentId = 2000;
    
    // Define additional math quiz questions with varying types and difficulty
    const extendedQuizQuestions = [
      // Number Concepts and Operations
      {
        content: 'If you have 127 stickers and give away 39, how many stickers do you have left?',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '88',
          hint: 'Subtract 39 from 127',
          explanation: '127 - 39 = 88',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'Miguel had 35 marbles. He gave 12 to his friend and then got 8 more from his sister. How many marbles does Miguel have now?',
        type: 'word_problem',
        difficulty: 2,
        metadata: {
          answer: '31',
          hint: 'First subtract the marbles he gave away, then add the new ones',
          explanation: '35 - 12 = 23, then 23 + 8 = 31',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'A store sells notebooks in packages of 6. How many notebooks are in 7 packages?',
        type: 'multiple_choice',
        difficulty: 2,
        metadata: {
          answer: '42',
          choices: ['36', '42', '48', '54'],
          hint: 'Multiply the number of notebooks in each package by the number of packages',
          explanation: '6 × 7 = 42',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'If 48 students are divided equally into 6 groups, how many students are in each group?',
        type: 'computation',
        difficulty: 2,
        metadata: {
          answer: '8',
          hint: 'Divide the total number of students by the number of groups',
          explanation: '48 ÷ 6 = 8',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'Round 3,742 to the nearest hundred.',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '3,700',
          choices: ['3,700', '3,740', '3,750', '3,800'],
          hint: 'Look at the tens digit to determine if you round up or down',
          explanation: 'The tens digit is 4, which is less than 5, so we round down to 3,700',
          question_type: 'multiple_choice'
        }
      },
      
      // Fractions and Decimals
      {
        content: 'What fraction of the shape is shaded? [Image shows 3 out of 4 parts shaded]',
        type: 'multiple_choice',
        difficulty: 1,
        metadata: {
          answer: '3/4',
          choices: ['1/4', '2/4', '3/4', '4/3'],
          hint: 'Count the total parts and the shaded parts',
          explanation: 'There are 4 total parts, and 3 are shaded. So the fraction is 3/4',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'Which fraction is equivalent to 6/8?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '3/4',
          choices: ['1/2', '2/3', '3/4', '7/9'],
          hint: 'Divide both the numerator and denominator by their greatest common factor',
          explanation: 'The greatest common factor of 6 and 8 is 2. Dividing both by 2: 6÷2=3, 8÷2=4, so 6/8 = 3/4',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'Write 0.75 as a fraction.',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '3/4',
          choices: ['3/4', '7/5', '75/10', '75/100'],
          hint: 'Remember that 0.75 = 75/100, then simplify',
          explanation: '0.75 = 75/100. The greatest common factor of 75 and 100 is 25. Dividing both by 25: 75÷25=3, 100÷25=4, so 75/100 = 3/4',
          question_type: 'multiple_choice'
        }
      },
      {
        content: 'What is 3.7 + 2.45?',
        type: 'computation',
        difficulty: 2,
        metadata: {
          answer: '6.15',
          hint: 'Line up the decimal points and add',
          explanation: 'Adding 3.70 + 2.45 = 6.15',
          question_type: 'fill_in_blank'
        }
      },
      
      // Geometry
      {
        content: 'What is the area of a rectangle with length 8 cm and width 5 cm?',
        type: 'computation',
        difficulty: 2,
        metadata: {
          answer: '40',
          hint: 'Area of rectangle = length × width',
          explanation: 'Area = 8 cm × 5 cm = 40 cm²',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'Find the perimeter of a square with sides of 7 meters each.',
        type: 'multiple_choice',
        difficulty: 2,
        metadata: {
          answer: '28',
          choices: ['14', '21', '28', '49'],
          hint: 'Perimeter = sum of all sides',
          explanation: 'Perimeter = 4 × 7 meters = 28 meters',
          question_type: 'multiple_choice'
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
      
      // Measurement
      {
        content: 'How many minutes are in 2.5 hours?',
        type: 'computation',
        difficulty: 2,
        metadata: {
          answer: '150',
          hint: 'Multiply hours by 60 to get minutes',
          explanation: '2.5 hours = 2.5 × 60 minutes = 150 minutes',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'How many centimeters are in 3.5 meters?',
        type: 'computation',
        difficulty: 2,
        metadata: {
          answer: '350',
          hint: 'Multiply meters by 100 to get centimeters',
          explanation: '3.5 meters = 3.5 × 100 cm = 350 cm',
          question_type: 'fill_in_blank'
        }
      },
      
      // Data and Statistics
      {
        content: 'The test scores of 5 students are: 85, 92, 78, 90, and 85. What is the mean (average) score?',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '86',
          hint: 'Add all scores and divide by the number of students',
          explanation: '(85 + 92 + 78 + 90 + 85) ÷ 5 = 430 ÷ 5 = 86',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'The following data shows the number of books read by students: 3, 5, 2, 4, 3, 5, 4, 3. What is the mode?',
        type: 'multiple_choice',
        difficulty: 3,
        metadata: {
          answer: '3',
          choices: ['2', '3', '4', '5'],
          hint: 'The mode is the number that appears most frequently',
          explanation: 'The number 3 appears three times, more than any other number, so 3 is the mode',
          question_type: 'multiple_choice'
        }
      },
      
      // Word Problems
      {
        content: 'Juana has 24 flowers. She wants to put an equal number in 4 vases. How many flowers will be in each vase?',
        type: 'word_problem',
        difficulty: 2,
        metadata: {
          answer: '6',
          hint: 'Divide the total number of flowers by the number of vases',
          explanation: '24 flowers ÷ 4 vases = 6 flowers per vase',
          question_type: 'fill_in_blank'
        }
      },
      {
        content: 'Carlos buys a notebook for 45 pesos and a pen for 12 pesos. If he pays with a 100-peso bill, how much change should he receive?',
        type: 'word_problem',
        difficulty: 3,
        metadata: {
          answer: '43',
          hint: 'Add the costs together, then subtract from 100',
          explanation: 'Cost: 45 + 12 = 57 pesos. Change: 100 - 57 = 43 pesos',
          question_type: 'fill_in_blank'
        }
      },
      
      // More advanced questions
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
      },
      
      // Additional questions to ensure we have enough
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
      },
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
        content: 'If 7 pencils cost 35 pesos, how much will 10 pencils cost?',
        type: 'computation',
        difficulty: 3,
        metadata: {
          answer: '50',
          hint: 'Find the cost of one pencil, then multiply by 10',
          explanation: 'One pencil costs 35 ÷ 7 = 5 pesos. So 10 pencils will cost 10 × 5 = 50 pesos.',
          question_type: 'fill_in_blank'
        }
      }
    ];
    
    // Assign each question to a knowledge component
    const contentItemsToCreate = [];
    
    for (let i = 0; i < extendedQuizQuestions.length; i++) {
      // Select a knowledge component - distribute evenly instead of randomly
      const kcIndex = i % knowledgeComponents.length;
      const kc = knowledgeComponents[kcIndex];
      const question = extendedQuizQuestions[i];
      
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
      await queryInterface.bulkInsert('content_items', contentItemsToCreate);
      console.log(`Created ${contentItemsToCreate.length} extended quiz questions`);
    }

    console.log('Successfully created extended quiz questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 2000 to 2099)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 2000 AND id < 2100`
    );
  }
};