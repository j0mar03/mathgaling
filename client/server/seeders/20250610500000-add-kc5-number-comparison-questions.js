'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component with curriculum code G4-Q1M2-KC05
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M2-KC05'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC5 knowledge component not found, cannot create questions');
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
    // Start with 7400 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910, 
    // KC1: 7000-7010, KC2: 7100-7110, KC3: 7200-7210, KC4: 7300-7310)
    let contentId = 7400;

    // Define the new quiz questions for KC5
    const kc5Questions = [
      {
        content: "Compare 2,345 and 1,234. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["<", ">", "=", "None"],
        correct_answer: "B",
        explanation: "Upang ihambing ang 2,345 at 1,234, tingnan ang mga digit sa parehong posisyon. Parehong may 4 na digit ang mga bilang. Simulan sa thousands place: 2 (sa 2,345) ay mas malaki kaysa 1 (sa 1,234). Kaya, 2,345 > 1,234. Ang tamang sagot ay >, kaya letra B.",
        hint: "Compare the number of digits first, then the digits in each place."
      },
      {
        content: "Compare 789 and 1,000. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["<", ">", "=", "None"],
        correct_answer: "A",
        explanation: "Ang 789 ay may 3 digit, habang ang 1,000 ay may 4 na digit. Ang bilang na may mas maraming digit ay mas malaki. Kaya, 789 < 1,000. Ang tamang sagot ay <, kaya letra A.",
        hint: "Check the number of digits first."
      },
      {
        content: "Compare 5,678 and 5,432. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["<", ">", "=", "None"],
        correct_answer: "B",
        explanation: "Parehong may 4 na digit ang 5,678 at 5,432. Simulan sa thousands place: parehong 5. Sa hundreds place: 6 (sa 5,678) ay mas malaki kaysa 4 (sa 5,432). Kaya, 5,678 > 5,432. Ang tamang sagot ay >, kaya letra B.",
        hint: "Both numbers have the same number of digits. Compare digits starting from the thousands place."
      },
      {
        content: "Compare 9,123 and 9,321. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["<", ">", "=", "None"],
        correct_answer: "A",
        explanation: "Parehong may 4 na digit ang 9,123 at 9,321. Sa thousands place: parehong 9. Sa hundreds place: 1 (sa 9,123) ay mas maliit kaysa 3 (sa 9,321). Kaya, 9,123 < 9,321. Ang tamang sagot ay <, kaya letra A.",
        hint: "Compare digits step-by-step from thousands to ones."
      },
      {
        content: "Compare 45,678 and 46,123. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["<", ">", "=", "None"],
        correct_answer: "A",
        explanation: "Parehong may 5 digit ang 45,678 at 46,123. Sa ten thousands place: 4 (sa 45,678) ay pareho sa 4 (sa 46,123), pero sa thousands place: 5 (sa 45,678) ay mas maliit kaysa 6 (sa 46,123). Kaya, 45,678 < 46,123. Ang tamang sagot ay <, kaya letra A.",
        hint: "Both are five-digit numbers. Start comparing from the ten thousands place."
      },
      {
        content: "Compare 78,901 and 78,901. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["<", ">", "=", "None"],
        correct_answer: "C",
        explanation: "Ang 78,901 at 78,901 ay parehong bilang, na may parehong digit sa bawat posisyon (ten thousands: 7, thousands: 8, hundreds: 9, tens: 0, ones: 1). Kaya, 78,901 = 78,901. Ang tamang sagot ay =, kaya letra C.",
        hint: "Check if all digits are identical."
      },
      {
        content: "Compare 60,005 and 60,050. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["<", ">", "=", "None"],
        correct_answer: "A",
        explanation: "Parehong may 5 digit ang 60,005 at 60,050. Sa ten thousands at thousands place: parehong 6 at 0. Sa hundreds place: 0 (sa 60,005) ay pareho sa 0 (sa 60,050). Sa tens place: 0 (sa 60,005) ay mas maliit kaysa 5 (sa 60,050). Kaya, 60,005 < 60,050. Ang tamang sagot ay <, kaya letra A.",
        hint: "Focus on the digits after the thousands place, as the ten thousands and thousands are the same."
      },
      {
        content: "Compare 99,990 and 100,000. Which symbol is correct?",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["<", ">", "=", "None"],
        correct_answer: "A",
        explanation: "Ang 99,990 ay may 5 digit at ang 100,000 ay may 6 na digit. Ang bilang na may mas maraming digit ay mas malaki. Kaya, 99,990 < 100,000. Ang tamang sagot ay <, kaya letra A.",
        hint: "Compare the number of digits and the highest place value first."
      },
      {
        content: "A store has 23,456 pencils and 23,465 pens. Which statement is true?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["23,456 pencils > 23,465 pens", "23,456 pencils < 23,465 pens", "23,456 pencils = 23,465 pens", "Cannot be determined"],
        correct_answer: "B",
        explanation: "Ihambing ang 23,456 at 23,465. Parehong may 5 digit. Sa ten thousands at thousands place: parehong 2 at 3. Sa hundreds place: 4 (sa 23,456) ay pareho sa 4 (sa 23,465). Sa tens place: 5 (sa 23,456) ay mas maliit kaysa 6 (sa 23,465). Kaya, 23,456 < 23,465, ibig sabihin ang mga lapis ay mas kaunti kaysa mga panulat. Ang tamang sagot ay letra B.",
        hint: "Compare the numbers digit-by-digit to determine the relationship."
      },
      {
        content: "School A has 45,000 books, and School B has 40,000 books plus 5,000 magazines. Which statement is true?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["School A has more books than School B's total.", "School B's total is greater than School A's books.", "School A and School B have equal totals.", "Cannot be determined."],
        correct_answer: "A",
        explanation: "Kalkulahin ang kabuuan ng School B: 40,000 libro + 5,000 magasin = 45,000. Ihambing ang 45,000 (School A) at 45,000 (School B). Pareho ang bilang, pero ang tanong ay tungkol sa mga libro. Si School A ay may 45,000 libro, habang si School B ay may 40,000 libro lamang (hindi kasama ang magasin sa bilang ng libro). Kaya, si School A ay may mas maraming libro. Ang tamang sagot ay letra A.",
        hint: "Calculate the total for School B first, then compare with School A."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc5Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC5 number comparison questions`);
    }

    console.log('Successfully created KC5 number comparison questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7400 to 7410)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7400 AND id < 7410`
    );
  }
}; 