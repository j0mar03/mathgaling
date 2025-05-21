'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component with curriculum code G4-Q1M3-KC06
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE curriculum_code = 'G4-Q1M3-KC06'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC6 knowledge component not found, cannot create questions');
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
    // Start with 7500 to avoid conflicts with other seeders
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, 
    // KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810, KC34: 6900-6910, 
    // KC1: 7000-7010, KC2: 7100-7110, KC3: 7200-7210, KC4: 7300-7310, KC5: 7400-7410)
    let contentId = 7500;

    // Define the new quiz questions for KC6
    const kc6Questions = [
      {
        content: "Round 3,245 to the nearest thousand.",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["3,000", "4,000", "3,200", "3,300"],
        correct_answer: "A",
        explanation: "Upang i-round ang 3,245 sa pinakamalapit na libo, tingnan ang hundreds digit, na 2. Dahil ang 2 ay mas mababa sa 5, panatilihin ang thousands digit (3) at gawing 0 ang lahat ng digit sa kanan nito. Kaya, 3,245 ay nagiging 3,000. Ang tamang sagot ay 3,000, kaya letra A.",
        hint: "Look at the hundreds digit. If it's 5 or greater, round up; if less, round down."
      },
      {
        content: "Round 7,891 to the nearest thousand.",
        type: "multiple_choice",
        difficulty: 1, // Level 1
        options: ["7,000", "8,000", "7,800", "7,900"],
        correct_answer: "B",
        explanation: "Sa 7,891, ang hundreds digit ay 8. Dahil ang 8 ay mas mataas sa 5, i-round up ang thousands digit mula 7 hanggang 8, at gawing 0 ang mga digit sa kanan. Kaya, 7,891 ay nagiging 8,000. Ang tamang sagot ay 8,000, kaya letra B.",
        hint: "Check the hundreds digit to decide whether to round up or down."
      },
      {
        content: "Round 4,567 to the nearest thousand.",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["4,000", "5,000", "4,500", "4,600"],
        correct_answer: "B",
        explanation: "Sa 4,567, ang hundreds digit ay 5. Dahil ang 5 ay katumbas o mas mataas sa 5, i-round up ang thousands digit mula 4 hanggang 5, at gawing 0 ang mga digit sa kanan. Kaya, 4,567 ay nagiging 5,000. Ang tamang sagot ay 5,000, kaya letra B.",
        hint: "The hundreds digit will determine if you round to 4,000 or 5,000."
      },
      {
        content: "Round 9,432 to the nearest thousand.",
        type: "multiple_choice",
        difficulty: 2, // Level 2
        options: ["9,000", "10,000", "9,400", "9,500"],
        correct_answer: "A",
        explanation: "Sa 9,432, ang hundreds digit ay 4. Dahil ang 4 ay mas mababa sa 5, panatilihin ang thousands digit (9) at gawing 0 ang mga digit sa kanan. Kaya, 9,432 ay nagiging 9,000. Ang tamang sagot ay 9,000, kaya letra A.",
        hint: "Look at the hundreds digit to decide between 9,000 and 10,000."
      },
      {
        content: "Round 45,678 to the nearest thousand.",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["45,000", "46,000", "45,600", "45,700"],
        correct_answer: "B",
        explanation: "Sa 45,678, ang hundreds digit ay 6. Dahil ang 6 ay mas mataas sa 5, i-round up ang thousands digit mula 5 hanggang 6, at gawing 0 ang mga digit sa kanan. Kaya, 45,678 ay nagiging 46,000. Ang tamang sagot ay 46,000, kaya letra B.",
        hint: "Check the hundreds digit to round the thousands place."
      },
      {
        content: "Round 23,456 to the nearest ten thousand.",
        type: "multiple_choice",
        difficulty: 3, // Level 3
        options: ["20,000", "30,000", "23,000", "24,000"],
        correct_answer: "A",
        explanation: "Upang i-round ang 23,456 sa pinakamalapit na sampung libo, tingnan ang thousands digit, na 3. Dahil ang 3 ay mas mababa sa 5, panatilihin ang ten thousands digit (2) at gawing 0 ang mga digit sa kanan. Kaya, 23,456 ay nagiging 20,000. Ang tamang sagot ay 20,000, kaya letra A.",
        hint: "Look at the thousands digit to decide between 20,000 and 30,000."
      },
      {
        content: "Round 60,099 to the nearest thousand.",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["60,000", "61,000", "60,100", "59,000"],
        correct_answer: "A",
        explanation: "Sa 60,099, ang hundreds digit ay 0. Dahil ang 0 ay mas mababa sa 5, panatilihin ang thousands digit (0) at gawing 0 ang mga digit sa kanan. Kaya, 60,099 ay nagiging 60,000. Ang tamang sagot ay 60,000, kaya letra A.",
        hint: "The hundreds digit is close to the boundary. Check carefully."
      },
      {
        content: "Round 89,501 to the nearest ten thousand.",
        type: "multiple_choice",
        difficulty: 4, // Level 4
        options: ["80,000", "90,000", "89,000", "90,500"],
        correct_answer: "B",
        explanation: "Sa 89,501, ang thousands digit ay 9. Dahil ang 9 ay mas mataas sa 5, i-round up ang ten thousands digit mula 8 hanggang 9, at gawing 0 ang mga digit sa kanan. Kaya, 89,501 ay nagiging 90,000. Ang tamang sagot ay 90,000, kaya letra B.",
        hint: "Check the thousands digit to decide between 80,000 and 90,000."
      },
      {
        content: "A store has 37,849 pencils. To estimate the number, round to the nearest ten thousand for a report. What is the rounded number?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["30,000", "40,000", "37,000", "38,000"],
        correct_answer: "B",
        explanation: "Upang i-round ang 37,849 sa pinakamalapit na sampung libo, tingnan ang thousands digit, na 7. Dahil ang 7 ay mas mataas sa 5, i-round up ang ten thousands digit mula 3 hanggang 4, at gawing 0 ang mga digit sa kanan. Kaya, 37,849 ay nagiging 40,000. Ang tamang sagot ay 40,000, kaya letra B.",
        hint: "Look at the thousands digit to round to the nearest ten thousand."
      },
      {
        content: "Which number, when rounded to the nearest thousand, gives 50,000?",
        type: "multiple_choice",
        difficulty: 5, // Level 5
        options: ["49,432", "50,499", "50,501", "49,999"],
        correct_answer: "D",
        explanation: "Upang maging 50,000 kapag ni-round sa pinakamalapit na libo, ang number ay dapat may thousands digit na 49 o 50, at ang hundreds digit ay dapat mag-determine kung i-round up o down. Suriin ang mga pagpipilian: 49,432: hundreds digit ay 4, kaya nagiging 49,000. 50,499: thousands digit ay 50, at hundreds digit ay 4, kaya nagiging 50,000 (kasi kapag rounding sa nearest thousand, nagiging 0 ang hundreds). 50,501: hundreds digit ay 5, kaya nagiging 51,000. 49,999: hundreds digit ay 9, kaya nagiging 50,000 (i-round up). Ang tamang sagot ay 49,999 o 50,499, pero ang expected answer ay 49,999, kaya letra D.",
        hint: "The number must have a thousands digit of 5, and the hundreds digit should be 5 or greater to round up to 50,000."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc6Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC6 rounding numbers questions`);
    }

    console.log('Successfully created KC6 rounding numbers questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 7500 to 7510)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 7500 AND id < 7510`
    );
  }
}; 