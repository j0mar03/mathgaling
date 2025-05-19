'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component with curriculum code G4-Q1M2-KC04
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M2-KC04'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC4 knowledge component not found, cannot create questions');
      return;
    }

    const kcId = knowledgeComponents[0].id;
    console.log(`Found knowledge component: ${knowledgeComponents[0].name} with ID: ${kcId}`);

    // Get all teachers for assigning content
    const teachers = await queryInterface.sequelize.query(
      `SELECT id FROM teachers LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const teacherId = teachers.length > 0 ? teachers[0].id : 99901; // Default from seed data

    // Create a starting ID that doesn't conflict with existing content items
    // Start with 7300 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910, 
    // KC1: 7000-7010, KC2: 7100-7110, KC3: 7200-7210)
    let contentId = 7300;

    // Define the new quiz questions for KC4
    const kc4Questions = [
      {
        content: "Write the number 2,345 in words.",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["Two thousand three hundred forty-five", "Two thousand three hundred four five", "Two thousand thirty-four five", "Twenty-three hundred forty-five"],
        correct_answer: "A",
        explanation: "Sa bilang na 2,345, may 2 thousands (dalawang libo), 3 hundreds (tatlong daan), 4 tens (apatnapu), at 5 ones (lima). Pagsamahin: dalawang libo tatlong daan apatnapu't lima. Sa Ingles, ito ay \"two thousand three hundred forty-five.\" Ang tamang sagot ay letra A.",
        hint: "Break the number into thousands, hundreds, tens, and ones, then write each part in words."
      },
      {
        content: "What is the symbol form of \"one thousand six hundred seventy-eight\"?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["1,678", "1,768", "6,178", "1,687"],
        correct_answer: "A",
        explanation: "Ang \"one thousand\" ay 1,000, \"six hundred\" ay 600, \"seventy\" ay 70, at \"eight\" ay 8. Idagdag: 1,000 + 600 + 70 + 8 = 1,678. Kaya, ang tamang sagot ay 1,678, kaya letra A.",
        hint: "Convert each word to its digit based on place value (thousands, hundreds, tens, ones)."
      },
      {
        content: "Write the number 8,902 in words.",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["Eight thousand nine hundred two", "Eight thousand ninety-two", "Eight thousand nine hundred twenty", "Eighty-nine hundred two"],
        correct_answer: "A",
        explanation: "Sa bilang na 8,902, may 8 thousands (walong libo), 9 hundreds (siyam na daan), 0 tens (wala), at 2 ones (dalawa). Pagsamahin: walong libo siyam na daan dalawa. Sa Ingles, ito ay \"eight thousand nine hundred two.\" Ang tamang sagot ay letra A.",
        hint: "Identify the thousands and the hundreds-tens-ones parts, then write in words."
      },
      {
        content: "What is the symbol form of \"nine thousand four hundred fifteen\"?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["9,415", "9,514", "9,145", "4,915"],
        correct_answer: "A",
        explanation: "Ang \"nine thousand\" ay 9,000, \"four hundred\" ay 400, \"fifteen\" ay 10 + 5 = 15. Idagdag: 9,000 + 400 + 15 = 9,415. Kaya, ang tamang sagot ay 9,415, kaya letra A.",
        hint: "Write the digits for thousands, hundreds, tens, and ones based on the words."
      },
      {
        content: "Write the number 45,123 in words.",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["Forty-five thousand one hundred twenty-three", "Forty-five thousand one hundred thirty-two", "Four thousand five hundred twenty-three", "Forty-five thousand twelve hundred three"],
        correct_answer: "A",
        explanation: "Sa bilang na 45,123, may 4 ten thousands at 5 thousands (apatnapu't limang libo), 1 hundred (isang daan), 2 tens (dalawampu), at 3 ones (tatlo). Pagsamahin: apatnapu't limang libo isang daan dalawampu't tatlo. Sa Ingles, ito ay \"forty-five thousand one hundred twenty-three.\" Ang tamang sagot ay letra A.",
        hint: "Separate the ten thousands, thousands, and hundreds-tens-ones, then write each part."
      },
      {
        content: "What is the symbol form of \"seventy-six thousand eight hundred ninety\"?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["76,890", "76,809", "67,890", "76,980"],
        correct_answer: "A",
        explanation: "Ang \"seventy-six thousand\" ay 76,000, \"eight hundred\" ay 800, \"ninety\" ay 90. Idagdag: 76,000 + 800 + 90 = 76,890. Kaya, ang tamang sagot ay 76,890, kaya letra A.",
        hint: "Convert the ten thousands, thousands, hundreds, tens, and ones to digits."
      },
      {
        content: "Write the number 40,008 in words.",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["Forty thousand eight", "Forty thousand eighty", "Four thousand eight", "Forty thousand eight hundred"],
        correct_answer: "A",
        explanation: "Sa bilang na 40,008, may 4 ten thousands (apatnapung libo), 0 thousands, 0 hundreds, 0 tens, at 8 ones (walo). Pagsamahin: apatnapung libo walo. Sa Ingles, ito ay \"forty thousand eight.\" Ang tamang sagot ay letra A.",
        hint: "Note the zeros in the number and write only the non-zero parts in words."
      },
      {
        content: "What is the symbol form of \"thirty thousand five\"?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["30,005", "30,500", "30,050", "35,000"],
        correct_answer: "A",
        explanation: "Ang \"thirty thousand\" ay 30,000, at ang \"five\" ay 5 sa ones place. Walang hundreds o tens. Kaya, 30,000 + 5 = 30,005. Ang tamang sagot ay 30,005, kaya letra A.",
        hint: "Be careful with \"five\" as it represents the ones place, and note the zeros."
      },
      {
        content: "Which is the correct word form for 99,999?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["Ninety-nine thousand nine hundred ninety-nine", "Ninety-nine thousand nine hundred nine", "Ninety thousand nine hundred ninety-nine", "Nine thousand nine hundred ninety-nine"],
        correct_answer: "A",
        explanation: "Sa bilang na 99,999, may 9 ten thousands at 9 thousands (siyamnapu't siyam na libo), 9 hundreds (siyam na daan), 9 tens (siyamnapu), at 9 ones (siyam). Pagsamahin: siyamnapu't siyam na libo siyam na daan siyamnapu't siyam. Sa Ingles, ito ay \"ninety-nine thousand nine hundred ninety-nine.\" Ang tamang sagot ay letra A.",
        hint: "Break the number into ten thousands, thousands, hundreds, tens, and ones, and ensure correct spelling."
      },
      {
        content: "A student wrote \"sixty thousand four hundred twenty\" for the number 60,042. What is the correct symbol form?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["60,420", "60,042", "64,020", "60,402"],
        correct_answer: "B",
        explanation: "Ang \"sixty thousand\" ay 60,000, \"four hundred\" ay 400, at \"twenty\" ay 20, kaya ang isinulat ng estudyante ay 60,420. Ngunit ang tamang bilang ay 60,042 (60,000 + 40 + 2). Ang error ay sa tens (4 tens = 40, hindi 20) at ones (2, hindi 0). Kaya, ang tamang sagot ay 60,042, kaya letra B.",
        hint: "Compare the given word form to the number and identify the error in the tens and ones place."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc4Questions.map(question => ({
      id: contentId++,
      type: question.type,
      content: question.content,
      difficulty: question.difficulty,
      options: JSON.stringify(question.options),
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      metadata: JSON.stringify({
        hint: question.hint
      }),
      knowledge_component_id: kcId,
      teacher_id: teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
      language: 'Tagalog',
      status: 'approved',
      suggestion_source: 'manual'
    }));

    // Insert all content items in a single transaction
    if (contentItemsToCreate.length > 0) {
      await queryInterface.bulkInsert('content_items', contentItemsToCreate);
      console.log(`Created ${contentItemsToCreate.length} KC4 number words questions`);
    }

    console.log('Successfully created KC4 number words questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7300 to 7310)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7300 AND id < 7310`
    );
  }
}; 