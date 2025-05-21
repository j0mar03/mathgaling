'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component with curriculum code G4-Q1M3-KC07
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M3-KC07'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC7 knowledge component not found, cannot create questions');
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
    // Start with 7600 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910, 
    // KC1: 7000-7010, KC2: 7100-7110, KC3: 7200-7210, KC4: 7300-7310, KC5: 7400-7410, KC6: 7500-7510)
    let contentId = 7600;

    // Define the new quiz questions for KC7
    const kc7Questions = [
      {
        content: "Arrange the numbers 1,234, 789, and 2,345 in increasing order.",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["789, 1,234, 2,345", "2,345, 1,234, 789", "1,234, 789, 2,345", "789, 2,345, 1,234"],
        correct_answer: "A",
        explanation: "Upang ayusin ang 1,234, 789, at 2,345 sa pataas na pagkakasunod (maliit hanggang malaki), ihambing ang mga digit. Ang 789 ay may 3 digit, habang ang 1,234 at 2,345 ay may 4 na digit, kaya ang 789 ang pinakamaliit. Sa pagitan ng 1,234 at 2,345, ang thousands digit ay 1 at 2; kaya, 1,234 < 2,345. Ang tamang pagkakasunod ay 789, 1,234, 2,345. Ang sagot ay letra A.",
        hint: "Compare the number of digits first, then the digits in each place."
      },
      {
        content: "Arrange the numbers 567, 1,000, and 456 in decreasing order.",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["1,000, 567, 456", "456, 567, 1,000", "567, 456, 1,000", "1,000, 456, 567"],
        correct_answer: "A",
        explanation: "Upang ayusin ang 567, 1,000, at 456 sa pababang pagkakasunod (malaki hanggang maliit), tingnan ang bilang ng mga digit. Ang 1,000 ay may 4 na digit, habang ang 567 at 456 ay may 3 digit, kaya ang 1,000 ang pinakamalaki. Sa pagitan ng 567 at 456, ang hundreds digit ay 5 at 4; kaya, 567 > 456. Ang tamang pagkakasunod ay 1,000, 567, 456. Ang sagot ay letra A.",
        hint: "Start with the number with the most digits or the largest value."
      },
      {
        content: "Arrange the numbers 5,678, 5,432, and 5,890 in increasing order.",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["5,432, 5,678, 5,890", "5,890, 5,678, 5,432", "5,678, 5,432, 5,890", "5,432, 5,890, 5,678"],
        correct_answer: "A",
        explanation: "Ang 5,678, 5,432, at 5,890 ay may parehong thousands digit (5). Ihambing ang hundreds digit: 4 (sa 5,432), 6 (sa 5,678), 8 (sa 5,890). Ang 4 ay pinakamaliit, susunod ang 6, at ang 8 ay pinakamalaki. Kaya, ang pagkakasunod ay 5,432, 5,678, 5,890. Ang sagot ay letra A.",
        hint: "All numbers have four digits and the same thousands digit. Compare the hundreds place next."
      },
      {
        content: "Arrange the numbers 9,123, 9,321, and 9,012 in decreasing order.",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["9,321, 9,123, 9,012", "9,012, 9,123, 9,321", "9,123, 9,321, 9,012", "9,321, 9,012, 9,123"],
        correct_answer: "A",
        explanation: "Ang 9,123, 9,321, at 9,012 ay may parehong thousands digit (9). Sa hundreds place: 3 (sa 9,321), 1 (sa 9,123), 0 (sa 9,012). Ang 3 ay pinakamalaki, susunod ang 1, at ang 0 ay pinakamaliit. Kaya, ang pababang pagkakasunod ay 9,321, 9,123, 9,012. Ang sagot ay letra A.",
        hint: "Compare digits step-by-step from thousands to ones, as all are four-digit numbers."
      },
      {
        content: "Arrange the numbers 45,678, 46,123, and 44,999 in increasing order.",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["44,999, 45,678, 46,123", "46,123, 45,678, 44,999", "45,678, 44,999, 46,123", "44,999, 46,123, 45,678"],
        correct_answer: "A",
        explanation: "Ang 45,678, 46,123, at 44,999 ay may 5 digit. Sa ten thousands place: 4 (sa lahat). Sa thousands place: 4 (sa 44,999), 5 (sa 45,678), 6 (sa 46,123). Ang 4 ay pinakamaliit, susunod ang 5, at ang 6 ay pinakamalaki. Kaya, ang pataas na pagkakasunod ay 44,999, 45,678, 46,123. Ang sagot ay letra A.",
        hint: "Compare the ten thousands digit first, then the thousands digit if needed."
      },
      {
        content: "Arrange the numbers 78,901, 78,910, and 78,890 in decreasing order.",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["78,910, 78,901, 78,890", "78,890, 78,901, 78,910", "78,910, 78,890, 78,901", "78,901, 78,910, 78,890"],
        correct_answer: "A",
        explanation: "Ang 78,901, 78,910, at 78,890 ay may parehong ten thousands (7) at thousands digit (8). Sa hundreds place: 9 (sa 78,901 at 78,910), 8 (sa 78,890). Ang 78,890 ay pinakamaliit. Sa pagitan ng 78,901 at 78,910, sa tens place: 0 (sa 78,901) < 1 (sa 78,910). Kaya, ang pababang pagkakasunod ay 78,910, 78,901, 78,890. Ang sagot ay letra A.",
        hint: "All numbers have the same ten thousands and thousands digits. Compare the hundreds place next."
      },
      {
        content: "Arrange the numbers 60,005, 60,050, and 60,000 in increasing order.",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["60,000, 60,005, 60,050", "60,050, 60,005, 60,000", "60,005, 60,000, 60,050", "60,000, 60,050, 60,005"],
        correct_answer: "A",
        explanation: "Ang 60,005, 60,050, at 60,000 ay may parehong ten thousands (6) at thousands digit (0). Sa hundreds place: 0 (sa lahat). Sa tens place: 0 (sa 60,000 at 60,005), 5 (sa 60,050). Ang 60,050 ay pinakamalaki. Sa pagitan ng 60,000 at 60,005, sa ones place: 0 (sa 60,000) < 5 (sa 60,005). Kaya, ang pataas na pagkakasunod ay 60,000, 60,005, 60,050. Ang sagot ay letra A.",
        hint: "Focus on the digits after the thousands place, as the ten thousands and thousands are the same."
      },
      {
        content: "Arrange the numbers 99,990, 100,000, and 99,999 in decreasing order.",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["100,000, 99,999, 99,990", "99,999, 99,990, 100,000", "100,000, 99,990, 99,999", "99,990, 99,999, 100,000"],
        correct_answer: "A",
        explanation: "Ang 99,990, 100,000, at 99,999 ay may 5 o 6 na digit. Ang 100,000 (1 sa hundred thousands) ay pinakamalaki. Sa pagitan ng 99,990 at 99,999, parehong 9 sa ten thousands at thousands, ngunit sa hundreds place: 9 (sa 99,990) < 9 (sa 99,999), at sa tens place: 9 > 9, ones: 0 < 9. Kaya, 99,999 > 99,990. Ang pababang pagkakasunod ay 100,000, 99,999, 99,990. Ang sagot ay letra A.",
        hint: "Compare the number of digits and the ten thousands place first."
      },
      {
        content: "A store has 23,456 pencils, 23,465 pens, and 23,445 markers. Arrange the quantities in increasing order.",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["23,445, 23,456, 23,465", "23,465, 23,456, 23,445", "23,456, 23,445, 23,465", "23,445, 23,465, 23,456"],
        correct_answer: "A",
        explanation: "Ihambing ang 23,456 (lapis), 23,465 (panulat), at 23,445 (marker). Parehong 2 sa ten thousands at 3 sa thousands. Sa hundreds place: 4 (sa lahat). Sa tens place: 4 (sa 23,445), 5 (sa 23,456), 6 (sa 23,465). Ang 4 ay pinakamaliit, susunod ang 5, at ang 6 ay pinakamalaki. Kaya, ang pataas na pagkakasunod ay 23,445, 23,456, 23,465. Ang sagot ay letra A.",
        hint: "Compare the digits step-by-step, focusing on the tens place where they differ."
      },
      {
        content: "Arrange the populations of four towns: 45,678, 45,768, 45,687, and 45,876 in decreasing order.",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["45,876, 45,768, 45,687, 45,678", "45,678, 45,687, 45,768, 45,876", "45,876, 45,687, 45,768, 45,678", "45,768, 45,876, 45,678, 45,687"],
        correct_answer: "A",
        explanation: "Ang 45,678, 45,768, 45,687, at 45,876 ay may parehong ten thousands (4) at thousands digit (5). Sa hundreds place: 6 (sa 45,678), 7 (sa 45,768 at 45,687), 8 (sa 45,876). Ang 8 ay pinakamalaki (45,876). Sa 7s, sa tens place: 6 (sa 45,768) > 8 (sa 45,687). Sa 45,678, hundreds ay 6 (pinakamaliit). Kaya, ang pababang pagkakasunod ay 45,876, 45,768, 45,687, 45,678. Ang sagot ay letra A.",
        hint: "All numbers have the same ten thousands and thousands digits. Compare from the hundreds place."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc7Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC7 ordering numbers questions`);
    }

    console.log('Successfully created KC7 ordering numbers questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7600 to 7610)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7600 AND id < 7610`
    );
  }
}; 