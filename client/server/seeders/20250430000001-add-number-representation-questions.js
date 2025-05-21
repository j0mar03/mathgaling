'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all knowledge components
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name IN (
        'Representing Numbers from 1001 to 10,000',
        'Identifying Place Value and Value of Digits in 4- to 5-Digit Numbers',
        'Reading and Writing Numbers from 1001 to 10,000 in symbols and words',
        'Comparing Numbers up to 10,000 using symbols (>, <, =)',
        'Ordering Numbers with 4 to 5 Digits in ascending or descending order',
        'Rounding Numbers to the Nearest Tens, Hundreds, and Thousands',
        'Understanding Ordinal Numbers from 1st to 100th, with emphasis on positions from 21st to 100th using a point of reference'
      )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('Knowledge components not found, cannot create questions');
      return;
    }

    // Create a map of knowledge component names to IDs
    const kcMap = knowledgeComponents.reduce((map, kc) => {
      map[kc.name] = kc.id;
      return map;
    }, {});

    // Get a teacher ID
    const teachers = await queryInterface.sequelize.query(
      `SELECT id FROM teachers LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const teacherId = teachers.length > 0 ? teachers[0].id : 99901;

    // Create a starting ID that doesn't conflict with existing content items
    let contentId = 5000;

    const questions = [
      // Module 1: KC1 - Representing Numbers from 1001 to 10,000 (Difficulty 4)
      {
        content: "What is the expanded form of 8,942 using powers of 10?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Representing Numbers from 1001 to 10,000'],
        metadata: {
          answer: "8 × 10³ + 9 × 10² + 4 × 10¹ + 2 × 10⁰",
          choices: [
            "8 × 10³ + 9 × 10² + 4 × 10¹ + 2 × 10⁰",
            "8 × 1000 + 9 × 100 + 4 × 10 + 2 × 1",
            "8 × 10⁴ + 9 × 10³ + 4 × 10² + 2 × 10¹",
            "8 × 100 + 9 × 10 + 4 × 1 + 2 × 0.1"
          ],
          hint: "Remember that 10³ = 1000, 10² = 100, 10¹ = 10, and 10⁰ = 1",
          explanation: "8,942 can be written as 8 thousands (8 × 10³) + 9 hundreds (9 × 10²) + 4 tens (4 × 10¹) + 2 ones (2 × 10⁰)"
        }
      },
      {
        content: "Which number is represented by the base-ten blocks: 7 thousands blocks, 3 hundreds blocks, 0 tens blocks, and 9 ones blocks?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Representing Numbers from 1001 to 10,000'],
        metadata: {
          answer: "7,309",
          choices: [
            "7,309",
            "7,039",
            "7,390",
            "7,903"
          ],
          hint: "Count the blocks: 7 thousands = 7,000, 3 hundreds = 300, 0 tens = 0, 9 ones = 9",
          explanation: "7 thousands blocks = 7,000, 3 hundreds blocks = 300, 0 tens blocks = 0, 9 ones blocks = 9. Adding these together gives 7,309."
        }
      },
      {
        content: "What is the number represented by the following place value chart?\nThousands | Hundreds | Tens | Ones\n    6     |    4     |   2  |   8",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Representing Numbers from 1001 to 10,000'],
        metadata: {
          answer: "6,428",
          choices: [
            "6,428",
            "6,482",
            "6,248",
            "6,842"
          ],
          hint: "Read the digits from left to right: thousands, hundreds, tens, ones",
          explanation: "Reading from left to right: 6 thousands, 4 hundreds, 2 tens, and 8 ones = 6,428"
        }
      },

      // Module 1: KC2 - Identifying Place Value (Difficulty 4)
      {
        content: "In the number 9,876, what is the value of the digit 8?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Identifying Place Value and Value of Digits in 4- to 5-Digit Numbers'],
        metadata: {
          answer: "800",
          choices: [
            "800",
            "80",
            "8",
            "8,000"
          ],
          hint: "The digit 8 is in the hundreds place, so its value is 8 × 100",
          explanation: "The digit 8 is in the hundreds place, so its value is 8 × 100 = 800"
        }
      },
      {
        content: "Which digit in 7,654 has a value of 50?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Identifying Place Value and Value of Digits in 4- to 5-Digit Numbers'],
        metadata: {
          answer: "5",
          choices: [
            "5",
            "6",
            "7",
            "4"
          ],
          hint: "Look for the digit in the tens place, as 50 = 5 × 10",
          explanation: "The digit 5 is in the tens place, so its value is 5 × 10 = 50"
        }
      },
      {
        content: "What is the sum of the values of the digits 3 and 7 in the number 3,742?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Identifying Place Value and Value of Digits in 4- to 5-Digit Numbers'],
        metadata: {
          answer: "3,700",
          choices: [
            "3,700",
            "3,070",
            "3,007",
            "3,770"
          ],
          hint: "The digit 3 is in the thousands place (3,000) and the digit 7 is in the hundreds place (700)",
          explanation: "The digit 3 is in the thousands place (3,000) and the digit 7 is in the hundreds place (700). Their sum is 3,000 + 700 = 3,700"
        }
      },

      // Module 1: KC3 - Reading and Writing Numbers (Difficulty 4)
      {
        content: "What is the standard form of 'nine thousand, nine hundred ninety-nine'?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Reading and Writing Numbers from 1001 to 10,000 in symbols and words'],
        metadata: {
          answer: "9,999",
          choices: [
            "9,999",
            "9,909",
            "9,099",
            "9,990"
          ],
          hint: "Write each part in order: nine thousand (9,000), nine hundred (900), ninety (90), nine (9)",
          explanation: "Nine thousand = 9,000, nine hundred = 900, ninety = 90, nine = 9. Adding these together gives 9,999"
        }
      },
      {
        content: "Which number is written as 'eight thousand, four hundred twenty'?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Reading and Writing Numbers from 1001 to 10,000 in symbols and words'],
        metadata: {
          answer: "8,420",
          choices: [
            "8,420",
            "8,402",
            "8,240",
            "8,204"
          ],
          hint: "Break it down: eight thousand (8,000), four hundred (400), twenty (20)",
          explanation: "Eight thousand = 8,000, four hundred = 400, twenty = 20. Adding these together gives 8,420"
        }
      },
      {
        content: "What is the word form of 7,777?",
        type: "multiple_choice",
        difficulty: 4,
        knowledge_component_id: kcMap['Reading and Writing Numbers from 1001 to 10,000 in symbols and words'],
        metadata: {
          answer: "seven thousand, seven hundred seventy-seven",
          choices: [
            "seven thousand, seven hundred seventy-seven",
            "seven thousand, seven hundred seven",
            "seven thousand, seventy-seven",
            "seven thousand, seven hundred seven"
          ],
          hint: "Break down the number: 7 thousands, 7 hundreds, 7 tens, 7 ones",
          explanation: "7,777 is 7 thousands, 7 hundreds, 7 tens, and 7 ones, written as 'seven thousand, seven hundred seventy-seven'"
        }
      },

      // Module 2: KC4 - Comparing Numbers (Difficulty 5)
      {
        content: "Which comparison is correct: 8,765 ? 8,756",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Comparing Numbers up to 10,000 using symbols (>, <, =)'],
        metadata: {
          answer: ">",
          choices: [
            ">",
            "<",
            "=",
            "Cannot be determined"
          ],
          hint: "Compare the digits from left to right. When you find different digits, the larger digit means the larger number",
          explanation: "Comparing from left to right: 8=8, 7=7, 6>5. Since 6 is greater than 5 in the tens place, 8,765 > 8,756"
        }
      },
      {
        content: "Which number makes this statement true: 9,999 ? 10,000",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Comparing Numbers up to 10,000 using symbols (>, <, =)'],
        metadata: {
          answer: "<",
          choices: [
            "<",
            ">",
            "=",
            "Cannot be determined"
          ],
          hint: "10,000 is one more than 9,999",
          explanation: "9,999 is one less than 10,000, so 9,999 < 10,000"
        }
      },
      {
        content: "Which comparison is correct: 7,654 ? 7,645",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Comparing Numbers up to 10,000 using symbols (>, <, =)'],
        metadata: {
          answer: ">",
          choices: [
            ">",
            "<",
            "=",
            "Cannot be determined"
          ],
          hint: "Compare the digits from left to right. When you find different digits, the larger digit means the larger number",
          explanation: "Comparing from left to right: 7=7, 6=6, 5>4. Since 5 is greater than 4 in the tens place, 7,654 > 7,645"
        }
      },

      // Module 2: KC5 - Ordering Numbers (Difficulty 5)
      {
        content: "Which set of numbers is in ascending order?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Ordering Numbers with 4 to 5 Digits in ascending or descending order'],
        metadata: {
          answer: "4,321, 4,322, 4,323, 4,324",
          choices: [
            "4,321, 4,322, 4,323, 4,324",
            "4,324, 4,323, 4,322, 4,321",
            "4,321, 4,323, 4,322, 4,324",
            "4,324, 4,321, 4,322, 4,323"
          ],
          hint: "In ascending order, each number should be greater than the previous number",
          explanation: "4,321 < 4,322 < 4,323 < 4,324 shows the numbers increasing in value"
        }
      },
      {
        content: "Which set of numbers is in descending order?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Ordering Numbers with 4 to 5 Digits in ascending or descending order'],
        metadata: {
          answer: "9,999, 9,998, 9,997, 9,996",
          choices: [
            "9,999, 9,998, 9,997, 9,996",
            "9,996, 9,997, 9,998, 9,999",
            "9,999, 9,997, 9,998, 9,996",
            "9,996, 9,999, 9,997, 9,998"
          ],
          hint: "In descending order, each number should be less than the previous number",
          explanation: "9,999 > 9,998 > 9,997 > 9,996 shows the numbers decreasing in value"
        }
      },
      {
        content: "Which number should come next in this sequence: 5,432, 5,433, 5,434, ?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Ordering Numbers with 4 to 5 Digits in ascending or descending order'],
        metadata: {
          answer: "5,435",
          choices: [
            "5,435",
            "5,434",
            "5,436",
            "5,433"
          ],
          hint: "Look at the pattern: each number increases by 1",
          explanation: "The sequence increases by 1 each time: 5,432 + 1 = 5,433, 5,433 + 1 = 5,434, so the next number is 5,434 + 1 = 5,435"
        }
      },

      // Module 2: KC6 - Rounding Numbers (Difficulty 5)
      {
        content: "What is 8,765 rounded to the nearest hundred?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Rounding Numbers to the Nearest Tens, Hundreds, and Thousands'],
        metadata: {
          answer: "8,800",
          choices: [
            "8,800",
            "8,700",
            "8,770",
            "8,760"
          ],
          hint: "Look at the tens digit (6). If it's 5 or greater, round up the hundreds digit",
          explanation: "The tens digit is 6, which is greater than 5, so we round up the hundreds digit from 7 to 8, making it 8,800"
        }
      },
      {
        content: "What is 9,999 rounded to the nearest thousand?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Rounding Numbers to the Nearest Tens, Hundreds, and Thousands'],
        metadata: {
          answer: "10,000",
          choices: [
            "10,000",
            "9,000",
            "9,900",
            "9,990"
          ],
          hint: "Look at the hundreds digit (9). If it's 5 or greater, round up the thousands digit",
          explanation: "The hundreds digit is 9, which is greater than 5, so we round up the thousands digit from 9 to 10, making it 10,000"
        }
      },
      {
        content: "What is 7,654 rounded to the nearest ten?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Rounding Numbers to the Nearest Tens, Hundreds, and Thousands'],
        metadata: {
          answer: "7,650",
          choices: [
            "7,650",
            "7,660",
            "7,600",
            "7,700"
          ],
          hint: "Look at the ones digit (4). If it's less than 5, keep the tens digit the same",
          explanation: "The ones digit is 4, which is less than 5, so we keep the tens digit (5) the same and change the ones digit to 0, making it 7,650"
        }
      },

      // Module 3: KC7 - Ordinal Numbers (Difficulty 5)
      {
        content: "If Sarah is the 45th person in line, how many people are in front of her?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Understanding Ordinal Numbers from 1st to 100th, with emphasis on positions from 21st to 100th using a point of reference'],
        metadata: {
          answer: "44",
          choices: [
            "44",
            "45",
            "46",
            "43"
          ],
          hint: "The number of people in front is one less than the ordinal position",
          explanation: "If Sarah is 45th, there are 44 people in front of her (45 - 1 = 44)"
        }
      },
      {
        content: "If a race has 100 participants and John finished in 78th place, how many people finished after him?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Understanding Ordinal Numbers from 1st to 100th, with emphasis on positions from 21st to 100th using a point of reference'],
        metadata: {
          answer: "22",
          choices: [
            "22",
            "78",
            "21",
            "23"
          ],
          hint: "Subtract the ordinal position from the total number of participants",
          explanation: "If John is 78th out of 100, then 100 - 78 = 22 people finished after him"
        }
      },
      {
        content: "In a class of 30 students, if Maria is the 25th student when arranged alphabetically, how many students come after her?",
        type: "multiple_choice",
        difficulty: 5,
        knowledge_component_id: kcMap['Understanding Ordinal Numbers from 1st to 100th, with emphasis on positions from 21st to 100th using a point of reference'],
        metadata: {
          answer: "5",
          choices: [
            "5",
            "25",
            "6",
            "4"
          ],
          hint: "Subtract the ordinal position from the total number of students",
          explanation: "If Maria is 25th out of 30 students, then 30 - 25 = 5 students come after her"
        }
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = questions.map(question => ({
      id: contentId++,
      type: question.type,
      content: question.content,
      difficulty: question.difficulty,
      options: JSON.stringify(question.metadata.choices),
      correct_answer: question.metadata.answer,
      explanation: question.metadata.explanation,
      metadata: JSON.stringify({
        hint: question.metadata.hint
      }),
      knowledge_component_id: question.knowledge_component_id,
      teacher_id: teacherId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert the content items
    if (contentItemsToCreate.length > 0) {
      await queryInterface.bulkInsert('content_items', contentItemsToCreate);
      console.log(`Created ${contentItemsToCreate.length} questions`);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the questions we added
    await queryInterface.bulkDelete('content_items', {
      id: {
        [Sequelize.Op.between]: [5000, 5021] // Updated ID range to match new starting ID
      }
    });
  }
}; 