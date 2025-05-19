'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component with curriculum code G4-Q1M1-KC03
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M1-KC03'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC3 knowledge component not found, cannot create questions');
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
    // Start with 7200 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910, 
    // KC1: 7000-7010, KC2: 7100-7110)
    let contentId = 7200;

    // Define the new quiz questions for KC3
    const kc3Questions = [
      {
        content: "In the number 1,234, what is the value of the digit 4?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["4", "40", "400", "4,000"],
        correct_answer: "A",
        explanation: "Sa bilang na 1,234, ang digit na 4 ay nasa ones place. Ang halaga ng ones place ay 1. Kaya, ang halaga ng 4 ay 4 × 1 = 4. Ang tamang sagot ay 4, kaya letra A.",
        hint: "The digit 4 is in the ones place. Multiply 4 by the value of its place."
      },
      {
        content: "In the number 567, what is the value of the digit 6?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["6", "60", "600", "6,000"],
        correct_answer: "B",
        explanation: "Sa bilang na 567, ang digit na 6 ay nasa tens place. Ang halaga ng tens place ay 10. Kaya, ang halaga ng 6 ay 6 × 10 = 60. Ang tamang sagot ay 60, kaya letra B.",
        hint: "The digit 6 is in the tens place. Multiply 6 by the value of its place."
      },
      {
        content: "In the number 8,912, what is the value of the digit 9?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["9", "90", "900", "9,000"],
        correct_answer: "C",
        explanation: "Sa bilang na 8,912, ang digit na 9 ay nasa hundreds place. Ang halaga ng hundreds place ay 100. Kaya, ang halaga ng 9 ay 9 × 100 = 900. Ang tamang sagot ay 900, kaya letra C.",
        hint: "The digit 9 is in the hundreds place. Multiply 9 by the value of its place."
      },
      {
        content: "In the number 4,305, what is the value of the digit 3?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["3", "30", "300", "3,000"],
        correct_answer: "C",
        explanation: "Sa bilang na 4,305, ang digit na 3 ay nasa hundreds place (ikatlong posisyon mula sa kanan). Ang halaga ng hundreds place ay 100. Kaya, ang halaga ng 3 ay 3 × 100 = 300. Ang tamang sagot ay 300, kaya letra C.",
        hint: "Find the position of the digit 3 and multiply by its place value."
      },
      {
        content: "In the number 67,890, what is the value of the digit 7?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["7", "70", "7,000", "70,000"],
        correct_answer: "D",
        explanation: "Sa bilang na 67,890, ang digit na 7 ay nasa ten thousands place (unang posisyon mula sa kaliwa). Ang halaga ng ten thousands place ay 10,000. Kaya, ang halaga ng 7 ay 7 × 10,000 = 70,000. Ang tamang sagot ay 70,000, kaya letra D.",
        hint: "The digit 7 is in the ten thousands place. Multiply 7 by the value of its place."
      },
      {
        content: "In the number 23,456, what is the value of the digit 2?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["20", "200", "2,000", "20,000"],
        correct_answer: "D",
        explanation: "Sa bilang na 23,456, ang digit na 2 ay nasa ten thousands place (ikalimang posisyon mula sa kanan). Ang halaga ng ten thousands place ay 10,000. Kaya, ang halaga ng 2 ay 2 × 10,000 = 20,000. Ang tamang sagot ay 20,000, kaya letra D.",
        hint: "The digit 2 is in the ten thousands place. Multiply 2 by its place value."
      },
      {
        content: "A place value chart shows the number 81,506 as follows:\n\nTen Thousands | Thousands | Hundreds | Tens | Ones\n------------|----------|---------|------|-----\n8           | 1        | 5       | 0    | 6\n\nWhat is the value of the digit 5?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["5", "50", "500", "5,000"],
        correct_answer: "C",
        explanation: "Sa place value chart ng 81,506, ang digit na 5 ay nasa hundreds column. Ang halaga ng hundreds place ay 100. Kaya, ang halaga ng 5 ay 5 × 100 = 500. Ang tamang sagot ay 500, kaya letra C.",
        hint: "Look at the column of the digit 5 and multiply by its place value."
      },
      {
        content: "The expanded form of a number is 50,000 + 4,000 + 200 + 30 + 7. What is the value of the digit 4?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["4", "40", "400", "4,000"],
        correct_answer: "D",
        explanation: "Sa expanded form na 50,000 + 4,000 + 200 + 30 + 7, ang digit na 4 ay nasa 4,000, na kumakatawan sa thousands place. Ang halaga ng 4 ay 4 × 1,000 = 4,000. Kaya, ang tamang sagot ay 4,000, kaya letra D.",
        hint: "Find the term in the expanded form that includes the digit 4."
      },
      {
        content: "In the number 95,321, the digit 3 has a value of 300. If the digit 3 is moved to the ten thousands place, what is its new value?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["30", "300", "3,000", "30,000"],
        correct_answer: "D",
        explanation: "Sa bilang na 95,321, ang digit na 3 ay nasa hundreds place, kaya ang halaga nito ay 3 × 100 = 300. Kung ililipat ang 3 sa ten thousands place, ang halaga nito ay magiging 3 × 10,000 = 30,000. Kaya, ang bagong halaga ng 3 ay 30,000, kaya letra D.",
        hint: "Compare the current place value of 3 (hundreds) to its value in the ten thousands place."
      },
      {
        content: "A number has the digits 7, 2, and 9, where 7 has a value of 7,000, 2 has a value of 200, and 9 has a value of 9. What is the value of the digit 2?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["2", "20", "200", "2,000"],
        correct_answer: "C",
        explanation: "Batay sa impormasyon, ang digit na 7 ay may halagang 7,000 (thousands place), ang 2 ay may halagang 200 (hundreds place), at ang 9 ay may halagang 9 (ones place). Ang bilang ay 7,209. Ang halaga ng digit na 2 ay 2 × 100 = 200. Kaya, ang tamang sagot ay 200, kaya letra C.",
        hint: "The value of 2 is given as 200. Confirm its place value and the number formed."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc3Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC3 digit value questions`);
    }

    console.log('Successfully created KC3 digit value questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7200 to 7210)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7200 AND id < 7210`
    );
  }
}; 