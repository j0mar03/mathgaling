'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component with curriculum code G4-Q1M1-KC02
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M1-KC02'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC2 knowledge component not found, cannot create questions');
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
    // Start with 7100 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910, KC1: 7000-7010)
    let contentId = 7100;

    // Define the new quiz questions for KC2
    const kc2Questions = [
      {
        content: "In the number 2,346, what is the place value of the digit 3?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["Ones", "Tens", "Hundreds", "Thousands"],
        correct_answer: "C",
        explanation: "Sa bilang na 2,346, ang digit na 3 ay nasa ikatlong posisyon mula sa kanan. Ang posisyon mula sa kanan ay: ones, tens, hundreds, thousands. Kaya, ang 3 ay nasa hundreds place. Ang tamang sagot ay hundreds, kaya letra C.",
        hint: "Look at the position of the digit 3 in the number."
      },
      {
        content: "In the number 789, what is the place value of the digit 8?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["Ones", "Tens", "Hundreds", "Thousands"],
        correct_answer: "B",
        explanation: "Sa bilang na 789, ang digit na 8 ay nasa ikalawang posisyon mula sa kanan. Ang posisyon ay: ones, tens, hundreds. Kaya, ang 8 ay nasa tens place. Ang tamang sagot ay tens, kaya letra B.",
        hint: "Identify the position of the digit 8 from right to left."
      },
      {
        content: "In the number 12,456, what is the place value of the digit 2?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["Tens", "Hundreds", "Thousands", "Ten thousands"],
        correct_answer: "C",
        explanation: "Sa bilang na 12,456, ang digit na 2 ay nasa ikaapat na posisyon mula sa kanan. Ang posisyon ay: ones, tens, hundreds, thousands, ten thousands. Kaya, ang 2 ay nasa thousands place. Ang tamang sagot ay thousands, kaya letra C.",
        hint: "Count the position of the digit 2 in the number from right to left."
      },
      {
        content: "In the number 9,803, what is the place value of the digit 9?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["Hundreds", "Thousands", "Ten thousands", "Ones"],
        correct_answer: "B",
        explanation: "Sa bilang na 9,803, ang digit na 9 ay nasa unang posisyon mula sa kaliwa, o ikaapat mula sa kanan. Ang posisyon ay: ones, tens, hundreds, thousands. Kaya, ang 9 ay nasa thousands place. Ang tamang sagot ay thousands, kaya letra B.",
        hint: "The digit 9 is the first digit in a four-digit number."
      },
      {
        content: "In the number 45,672, what is the value of the digit 5?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["5", "50", "500", "5,000"],
        correct_answer: "D",
        explanation: "Sa bilang na 45,672, ang digit na 5 ay nasa ten thousands place (ika-apat na posisyon mula sa kaliwa). Ang halaga ng ten thousands place ay 10,000. Kaya, ang halaga ng 5 ay 5 × 10,000 = 5,000. Ang tamang sagot ay 5,000, kaya letra D.",
        hint: "Multiply the digit 5 by its place value (e.g., thousands = 1,000)."
      },
      {
        content: "In the number 78,901, what is the value of the digit 7?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["7", "70", "7,000", "70,000"],
        correct_answer: "D",
        explanation: "Sa bilang na 78,901, ang digit na 7 ay nasa ten thousands place (unang posisyon mula sa kaliwa). Ang halaga ng ten thousands place ay 10,000. Kaya, ang halaga ng 7 ay 7 × 10,000 = 70,000. Ang tamang sagot ay 70,000, kaya letra D.",
        hint: "Find the place value of 7 and multiply by the digit."
      },
      {
        content: "A place value chart shows the number 63,214 as follows:\n\nTen Thousands | Thousands | Hundreds | Tens | Ones\n------------|----------|---------|------|-----\n6           | 3        | 2       | 1    | 4\n\nWhat is the place value of the digit 2?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["Tens", "Hundreds", "Thousands", "Ten thousands"],
        correct_answer: "B",
        explanation: "Sa place value chart ng 63,214, ang digit na 2 ay nasa hundreds column. Ang hundreds column ay kumakatawan sa hundreds place. Kaya, ang place value ng 2 ay hundreds. Ang tamang sagot ay hundreds, kaya letra B.",
        hint: "Look at the column where the digit 2 is located in the chart."
      },
      {
        content: "The expanded form of a number is 40,000 + 5,000 + 300 + 20 + 6. What is the place value of the digit 5?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["Hundreds", "Thousands", "Ten thousands", "Ones"],
        correct_answer: "B",
        explanation: "Sa expanded form na 40,000 + 5,000 + 300 + 20 + 6, ang digit na 5 ay nasa 5,000, na kumakatawan sa thousands place. Kaya, ang place value ng 5 ay thousands. Ang tamang sagot ay thousands, kaya letra B.",
        hint: "Find the term in the expanded form that includes the digit 5."
      },
      {
        content: "In the number 92,587, which digit is in the thousands place?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["2", "5", "8", "9"],
        correct_answer: "A",
        explanation: "Sa bilang na 92,587, bilangin ang mga posisyon mula sa kanan: ones (7), tens (8), hundreds (5), thousands (2), ten thousands (9). Ang digit sa thousands place ay 2. Kaya, ang tamang sagot ay 2, kaya letra A.",
        hint: "Identify the fourth digit from the right or use a place value chart."
      },
      {
        content: "In the number 36,429, the digit in the hundreds place is 4. If the digit 4 is moved to the ten thousands place, what is the new value of the digit 4?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["40", "400", "4,000", "40,000"],
        correct_answer: "D",
        explanation: "Sa bilang na 36,429, ang digit na 4 ay nasa hundreds place, kaya ang halaga nito ay 4 × 100 = 400. Kung ililipat ang 4 sa ten thousands place, ang halaga nito ay magiging 4 × 10,000 = 40,000. Kaya, ang bagong halaga ng 4 ay 40,000, kaya letra D.",
        hint: "Compare the value of 4 in the hundreds place to its value in the ten thousands place."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc2Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC2 place value questions`);
    }

    console.log('Successfully created KC2 place value questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7100 to 7110)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7100 AND id < 7110`
    );
  }
}; 