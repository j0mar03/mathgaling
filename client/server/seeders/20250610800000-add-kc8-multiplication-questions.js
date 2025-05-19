'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component with curriculum code G4-Q1M4-KC08
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M4-KC08'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC8 knowledge component not found, cannot create questions');
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
    // Start with 7700 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910, 
    // KC1: 7000-7010, KC2: 7100-7110, KC3: 7200-7210, KC4: 7300-7310, KC5: 7400-7410, KC6: 7500-7510,
    // KC7: 7600-7610)
    let contentId = 7700;

    // Define the new quiz questions for KC8
    const kc8Questions = [
      {
        content: "What is 111 × 11?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["1,221", "1,111", "1,331", "1,211"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 111 × 11: 111 × 1 (ones) = 111. 111 × 10 (tens) = 1,110. Idagdag: 111 + 1,110 = 1,221. Ang kabuuan sa bawat column (ones: 1+0=1, tens: 1+1=2, hundreds: 1+1=2, thousands: 0+1=1) ay hindi lalampas sa 9, kaya walang regrouping. Ang tamang sagot ay 1,221, kaya letra A.",
        hint: "Multiply 111 by 1 (ones place), then by 10 (tens place), and add the partial products. Check that no column sum exceeds 9."
      },
      {
        content: "What is 101 × 12?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["1,212", "1,112", "1,202", "1,222"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 101 × 12: 101 × 2 (ones) = 202. 101 × 10 (tens) = 1,010. Idagdag: 202 + 1,010 = 1,212. Ang kabuuan: ones (2+0=2), tens (0+1=1), hundreds (2+0=2), thousands (0+1=1). Walang regrouping dahil walang sum na higit sa 9. Ang tamang sagot ay 1,212, kaya letra A.",
        hint: "Multiply 101 by 2, then by 10, and add. Ensure the sum in each place doesn't require carrying."
      },
      {
        content: "What is 121 × 12?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["1,452", "1,552", "1,442", "1,462"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 121 × 12: 121 × 2 = 242. 121 × 10 = 1,210. Idagdag: 242 + 1,210 = 1,452. Ang kabuuan: ones (2+0=2), tens (4+1=5), hundreds (2+2=4), thousands (0+1=1). Walang regrouping. Ang tamang sagot ay 1,452, kaya letra A.",
        hint: "Multiply 121 by 2 and 10, then add the results. Check each column for regrouping."
      },
      {
        content: "What is 112 × 13?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["1,456", "1,346", "1,466", "1,446"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 112 × 13: 112 × 3 = 336. 112 × 10 = 1,120. Idagdag: 336 + 1,120 = 1,456. Ang kabuuan: ones (6+0=6), tens (3+2=5), hundreds (3+1=4), thousands (0+1=1). Walang regrouping. Ang tamang sagot ay 1,456, kaya letra A.",
        hint: "Multiply 112 by 3 and 10, then add. Verify no column sum exceeds 9."
      },
      {
        content: "What is 212 × 12?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["2,544", "2,454", "2,534", "2,554"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 212 × 12: 212 × 2 = 424. 212 × 10 = 2,120. Idagdag: 424 + 2,120 = 2,544. Ang kabuuan: ones (4+0=4), tens (2+2=4), hundreds (4+1=5), thousands (0+2=2). Walang regrouping. Ang tamang sagot ay 2,544, kaya letra A.",
        hint: "Multiply 212 by 2 and 10, then add the partial products carefully."
      },
      {
        content: "What is 201 × 14?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["2,814", "2,714", "2,824", "2,804"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 201 × 14: 201 × 4 = 804. 201 × 10 = 2,010. Idagdag: 804 + 2,010 = 2,814. Ang kabuuan: ones (4+0=4), tens (0+1=1), hundreds (8+0=8), thousands (0+2=2). Walang regrouping. Ang tamang sagot ay 2,814, kaya letra A.",
        hint: "Multiply 201 by 4 and 10, then add. Ensure no carrying in the addition."
      },
      {
        content: "What is 231 × 13?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["3,003", "2,993", "3,013", "3,023"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 231 × 13: 231 × 3 = 693. 231 × 10 = 2,310. Idagdag: 693 + 2,310 = 3,003. Ang kabuuan: ones (3+0=3), tens (9+1=0, no carry), hundreds (6+3=9), thousands (0+2=2). Walang regrouping. Ang tamang sagot ay 3,003, kaya letra A.",
        hint: "Multiply 231 by 3 and 10, then add. Check each place value for no regrouping."
      },
      {
        content: "What is 122 × 15?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["1,830", "1,820", "1,840", "1,810"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 122 × 15: 122 × 5 = 610. 122 × 10 = 1,220. Idagdag: 610 + 1,220 = 1,830. Ang kabuuan: ones (0+0=0), tens (1+2=3), hundreds (6+2=8), thousands (0+1=1). Walang regrouping. Ang tamang sagot ay 1,830, kaya letra A.",
        hint: "Multiply 122 by 5 and 10, then add. Verify the sums in each column are less than 10."
      },
      {
        content: "A store has 121 boxes, each containing 12 pencils. How many pencils are there in total?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["1,452", "1,442", "1,462", "1,552"],
        correct_answer: "A",
        explanation: "Upang mahanap ang kabuuang lapis, i-multiply ang 121 × 12: 121 × 2 = 242. 121 × 10 = 1,210. Idagdag: 242 + 1,210 = 1,452. Ang kabuuan: ones (2+0=2), tens (4+1=5), hundreds (2+2=4), thousands (0+1=1). Walang regrouping. Kaya, may 1,452 lapis. Ang tamang sagot ay 1,452, kaya letra A.",
        hint: "Multiply 121 × 12 and ensure no regrouping occurs in the addition of partial products."
      },
      {
        content: "Which product is correct for 211 × 14 without regrouping?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["2,954", "2,944", "2,964", "2,934"],
        correct_answer: "A",
        explanation: "Upang i-multiply ang 211 × 14: 211 × 4 = 844. 211 × 10 = 2,110. Idagdag: 844 + 2,110 = 2,954. Ang kabuuan: ones (4+0=4), tens (4+1=5), hundreds (8+1=9), thousands (0+2=2). Walang regrouping dahil walang sum na higit sa 9. Ang tamang sagot ay 2,954, kaya letra A.",
        hint: "Calculate 211 × 14 and verify no column sum exceeds 9. Choose the correct product."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc8Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC8 multiplication questions`);
    }

    console.log('Successfully created KC8 multiplication questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7700 to 7710)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7700 AND id < 7710`
    );
  }
}; 