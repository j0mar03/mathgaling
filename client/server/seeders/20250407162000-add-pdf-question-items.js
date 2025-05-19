'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const contentItems = [
      // Add multiple choice questions
      {
        type: 'question',
        content: 'What is 42 + 19?',
        metadata: JSON.stringify({
          answer: '61',
          choices: ['59', '61', '63', '65'],
          hint: 'Add the ones first, then the tens.',
          explanation: 'First add 2+9=11, so write down 1 and carry the 1. Then add 4+1+1=6, giving you 61.',
          pdf_id: 2,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 2,
        knowledge_component_id: 58, // Grade 3 Addition
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 97 - 38?',
        metadata: JSON.stringify({
          answer: '59',
          choices: ['49', '51', '59', '61'],
          hint: 'You may need to borrow when subtracting the ones.',
          explanation: '7-8 requires borrowing, so it becomes 17-8=9. Then subtract 3 from the adjusted tens: 8-3=5, giving you 59.',
          pdf_id: 2,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 3,
        knowledge_component_id: 59, // Grade 3 Subtraction
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 6 × 8?',
        metadata: JSON.stringify({
          answer: '48',
          choices: ['42', '48', '54', '56'],
          hint: 'Think of 6 groups of 8 objects.',
          explanation: 'Multiplication means repeated addition. 6×8 means adding 8 six times: 8+8+8+8+8+8=48',
          pdf_id: 3,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 2,
        knowledge_component_id: 60, // Grade 3 Multiplication
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 24 ÷ 4?',
        metadata: JSON.stringify({
          answer: '6',
          choices: ['4', '6', '8', '12'],
          hint: 'Think about how many groups of 4 you can make from 24.',
          explanation: 'Division means splitting into equal groups. 24÷4 asks how many groups of 4 we can make from 24. Since 4×6=24, the answer is 6.',
          pdf_id: 3,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 2,
        knowledge_component_id: 61, // Grade 3 Division
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'If a rectangle has a length of 7 cm and a width of 5 cm, what is its area?',
        metadata: JSON.stringify({
          answer: '35 cm²',
          choices: ['24 cm²', '35 cm²', '40 cm²', '45 cm²'],
          hint: 'Area of a rectangle = length × width',
          explanation: 'To find the area of a rectangle, multiply the length by the width: 7 cm × 5 cm = 35 cm²',
          pdf_id: 4,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 3,
        knowledge_component_id: 62, // Grade 3 Area and Perimeter
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is the perimeter of a square with sides of 9 cm?',
        metadata: JSON.stringify({
          answer: '36 cm',
          choices: ['27 cm', '36 cm', '45 cm', '81 cm'],
          hint: 'Perimeter means the distance around the shape. Add all sides.',
          explanation: 'The perimeter of a square is found by adding all four sides: 9 cm + 9 cm + 9 cm + 9 cm = 36 cm',
          pdf_id: 4,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 2,
        knowledge_component_id: 62, // Grade 3 Area and Perimeter
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 3/4 + 1/4?',
        metadata: JSON.stringify({
          answer: '1',
          choices: ['1/2', '3/4', '1', '4/4'],
          hint: 'Add the numerators when the denominators are the same.',
          explanation: 'When fractions have the same denominator, we add the numerators: 3/4 + 1/4 = (3+1)/4 = 4/4 = 1',
          pdf_id: 5,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 3,
        knowledge_component_id: 63, // Grade 3 Fractions
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'If you have 8 apples and give 2/4 of them away, how many apples do you have left?',
        metadata: JSON.stringify({
          answer: '4',
          choices: ['2', '4', '6', '8'],
          hint: '2/4 is the same as 1/2',
          explanation: '2/4 = 1/2, so you give away half of 8 apples, which is 4 apples. That means you have 4 apples left.',
          pdf_id: 5,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 3,
        knowledge_component_id: 63, // Grade 3 Fractions
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Grade 4 Questions
      {
        type: 'question',
        content: 'What is 347 + 285?',
        metadata: JSON.stringify({
          answer: '632',
          choices: ['622', '632', '732', '532'],
          hint: 'Add the ones, then tens, then hundreds, carrying when necessary.',
          explanation: 'Ones: 7+5=12, write 2, carry 1. Tens: 1+4+8=13, write 3, carry 1. Hundreds: 1+3+2=6. Answer: 632',
          pdf_id: 6,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 3,
        knowledge_component_id: 64, // Grade 4 Addition
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 506 - 278?',
        metadata: JSON.stringify({
          answer: '228',
          choices: ['228', '238', '328', '338'],
          hint: 'You will need to borrow twice.',
          explanation: 'Ones: 6-8 requires borrowing, 16-8=8. Tens: 0-7 requires borrowing again, 10-7=3. Hundreds: 4-2=2. Answer: 228',
          pdf_id: 6,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 4,
        knowledge_component_id: 65, // Grade 4 Subtraction
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 25 × 16?',
        metadata: JSON.stringify({
          answer: '400',
          choices: ['386', '400', '410', '425'],
          hint: 'You can break this down into 25 × 10 + 25 × 6',
          explanation: '25 × 10 = 250, 25 × 6 = 150, 250 + 150 = 400',
          pdf_id: 7,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 4,
        knowledge_component_id: 66, // Grade 4 Multiplication
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 728 ÷ 8?',
        metadata: JSON.stringify({
          answer: '91',
          choices: ['81', '91', '98', '101'],
          hint: 'Use long division, dividing each place value.',
          explanation: '8 divides into 7 hundred 0 times with remainder 7. 8 divides into 72 tens 9 times with remainder 0. 8 divides into 8 ones 1 time with remainder 0. Answer: 91',
          pdf_id: 7,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 4,
        knowledge_component_id: 67, // Grade 4 Division
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 2/5 + 1/3?',
        metadata: JSON.stringify({
          answer: '11/15',
          choices: ['3/8', '3/15', '11/15', '12/15'],
          hint: 'Find a common denominator first.',
          explanation: 'Convert to equivalent fractions with denominator 15: 2/5 = 6/15, 1/3 = 5/15. Then add: 6/15 + 5/15 = 11/15',
          pdf_id: 8,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 4,
        knowledge_component_id: 69, // Grade 4 Fractions
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'question',
        content: 'What is 3/4 - 1/3?',
        metadata: JSON.stringify({
          answer: '5/12',
          choices: ['2/7', '1/4', '2/12', '5/12'],
          hint: 'Find a common denominator first.',
          explanation: 'Convert to equivalent fractions with denominator 12: 3/4 = 9/12, 1/3 = 4/12. Then subtract: 9/12 - 4/12 = 5/12',
          pdf_id: 8,
          source: 'pdf',
          automatic: true,
          question_type: 'multiple_choice'
        }),
        difficulty: 4,
        knowledge_component_id: 69, // Grade 4 Fractions
        language: 'English',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // --- Commented out to prevent conflicts with the newer 'replace-kcs-and-cis' seeder ---
    // This seeder attempts to insert CIs linked to specific KC IDs that are deleted by the newer seeder.
    console.log('Skipping insertion in 20250407162000-add-pdf-question-items.js');
    // return queryInterface.bulkInsert('content_items', contentItems);
    return Promise.resolve(); // Return a resolved promise as the function expects one
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('content_items', {
      content: {
        [Sequelize.Op.in]: [
          'What is 42 + 19?',
          'What is 97 - 38?',
          'What is 6 × 8?',
          'What is 24 ÷ 4?',
          'If a rectangle has a length of 7 cm and a width of 5 cm, what is its area?',
          'What is the perimeter of a square with sides of 9 cm?',
          'What is 3/4 + 1/4?',
          'If you have 8 apples and give 2/4 of them away, how many apples do you have left?',
          'What is 347 + 285?',
          'What is 506 - 278?',
          'What is 25 × 16?',
          'What is 728 ÷ 8?',
          'What is 2/5 + 1/3?',
          'What is 3/4 - 1/3?'
        ]
      }
    });
  }
};
