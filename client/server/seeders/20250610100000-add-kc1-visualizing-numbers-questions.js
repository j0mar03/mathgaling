'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC1: Visualizing Numbers up to 100 000 (Grade 4)"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M1-KC01'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC1 knowledge component not found, cannot create questions');
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
    // Start with 7000 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910)
    let contentId = 7000;

    // Define the new quiz questions for KC1
    const kc1Questions = [
      {
        content: "How many stars are represented by the following groups if each group has 10 stars and there are 5 groups?",
        type: "multiple_choice",
        difficulty: 1, // Easy
        options: ["40", "50", "60", "70"],
        correct_answer: "B",
        explanation: "Upang mailarawan ang bilang, bilangin ang mga grupo ng bituin. May 5 grupo, at bawat grupo ay may 10 bituin. Kaya, 5 × 10 = 50 bituin. Ang tamang sagot ay 50, kaya letra B.",
        hint: "Count the number of groups and multiply by the number of stars per group."
      },
      {
        content: "In a place value chart, the number 3,245 has 3 in the thousands place. What does this represent?",
        type: "multiple_choice",
        difficulty: 1, // Easy
        options: ["3 ones", "3 tens", "3 hundreds", "3 thousands"],
        correct_answer: "D",
        explanation: "Sa place value chart, ang digit na 3 sa thousands place ay kumakatawan sa 3 libo, o 3,000. Ang bawat digit ay may halaga batay sa posisyon nito. Kaya, ang 3 sa thousands place ay 3 thousands, kaya letra D.",
        hint: "Think about the value of the digit in the thousands place."
      },
      {
        content: "A box contains 100 pencils. If there are 6 boxes, how many pencils are there in total?",
        type: "multiple_choice",
        difficulty: 1, // Easy
        options: ["500", "600", "700", "800"],
        correct_answer: "B",
        explanation: "Upang mailarawan ang kabuuang bilang ng lapis, i-multiply ang bilang ng lapis sa isang kahon (100) sa bilang ng kahon (6). Kaya, 100 × 6 = 600 lapis. Ang tamang sagot ay 600, kaya letra B.",
        hint: "Multiply the number of pencils per box by the number of boxes."
      },
      {
        content: "On a number line, the point at 2,000 is marked. If you move 1,000 units to the right, where are you?",
        type: "multiple_choice",
        difficulty: 1, // Easy
        options: ["1,000", "2,000", "3,000", "4,000"],
        correct_answer: "C",
        explanation: "Sa number line, nagsimula ka sa 2,000. Kung lilipat ka ng 1,000 unit pakanan, idagdag ito: 2,000 + 1,000 = 3,000. Kaya, ang tamang sagot ay 3,000, kaya letra C.",
        hint: "Add the movement to the starting point on the number line."
      },
      {
        content: "A place value chart shows 5 in the ten thousands place, 2 in the thousands place, and 7 in the hundreds place. What is the number?",
        type: "multiple_choice",
        difficulty: 2, // Moderate
        options: ["52,700", "50,270", "5,270", "527,000"],
        correct_answer: "A",
        explanation: "Sa place value chart, ang 5 sa ten thousands place ay 50,000, ang 2 sa thousands place ay 2,000, at ang 7 sa hundreds place ay 700. Idagdag ang mga ito: 50,000 + 2,000 + 700 = 52,700. Kaya, ang tamang sagot ay 52,700, kaya letra A.",
        hint: "Write the digits based on their place values and combine them."
      },
      {
        content: "A school has 10 groups of 1,000 students each and 5 groups of 100 students each. How many students are there in total?",
        type: "multiple_choice",
        difficulty: 2, // Moderate
        options: ["10,500", "15,000", "10,050", "5,500"],
        correct_answer: "A",
        explanation: "Upang mailarawan ang kabuuang bilang ng mag-aaral, kalkulahin muna ang bawat grupo. May 10 grupo ng 1,000 mag-aaral: 10 × 1,000 = 10,000. May 5 grupo ng 100 mag-aaral: 5 × 100 = 500. Idagdag: 10,000 + 500 = 10,500. Kaya, ang tamang sagot ay 10,500, kaya letra A.",
        hint: "Calculate the students in each type of group and add them."
      },
      {
        content: "On a number line, the distance between 20,000 and 30,000 is divided into 10 equal parts. What is the value of each part?",
        type: "multiple_choice",
        difficulty: 2, // Moderate
        options: ["1,000", "2,000", "3,000", "10,000"],
        correct_answer: "A",
        explanation: "Sa number line, ang distansya mula 20,000 hanggang 30,000 ay 30,000 − 20,000 = 10,000. Hinati ito sa 10 pantay na bahagi: 10,000 ÷ 10 = 1,000. Kaya, ang halaga ng bawat bahagi ay 1,000, kaya letra A.",
        hint: "Find the total distance and divide by the number of parts."
      },
      {
        content: "A store has 25 boxes, each containing 1,000 candies, and 15 bags, each containing 100 candies. How many candies are there in total?",
        type: "multiple_choice",
        difficulty: 3, // Hard
        options: ["25,500", "26,500", "25,150", "26,000"],
        correct_answer: "B",
        explanation: "Upang mailarawan ang kabuuang bilang ng kendi, kalkulahin ang mga kendi sa kahon at supot. Para sa kahon: 25 × 1,000 = 25,000 kendi. Para sa supot: 15 × 100 = 1,500 kendi. Idagdag: 25,000 + 1,500 = 26,500 kendi. Kaya, ang tamang sagot ay 26,500, kaya letra B.",
        hint: "Multiply the candies per box and per bag by their respective quantities, then add."
      },
      {
        content: "A place value chart has 7 in the ten thousands place, 0 in the thousands place, 4 in the hundreds place, and 8 in the tens place. What is the number?",
        type: "multiple_choice",
        difficulty: 3, // Hard
        options: ["70,480", "7,048", "70,408", "704,800"],
        correct_answer: "C",
        explanation: "Sa place value chart, ang 7 sa ten thousands place ay 70,000, ang 0 sa thousands place ay 0, ang 4 sa hundreds place ay 400, at ang 8 sa tens place ay 80. Pagsamahin ang mga ito: 70,000 + 0 + 400 + 80 = 70,408. Kaya, ang tamang sagot ay 70,408, kaya letra C.",
        hint: "Combine the digits according to their place values, noting any zero placeholders."
      },
      {
        content: "A number line shows points at 50,000 and 75,000. If a point is at 62,500, how far is it from 50,000?",
        type: "multiple_choice",
        difficulty: 3, // Hard
        options: ["12,000", "12,500", "13,000", "25,000"],
        correct_answer: "B",
        explanation: "Sa number line, upang malaman ang distansya mula 50,000 hanggang 62,500, ibawas ang panimulang punto: 62,500 − 50,000 = 12,500. Kaya, ang distansya ay 12,500, kaya letra B.",
        hint: "Subtract the starting point from the given point to find the distance."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc1Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC1 visualizing numbers questions`);
    }

    console.log('Successfully created KC1 visualizing numbers questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7000 to 7010)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7000 AND id < 7010`
    );
  }
}; 