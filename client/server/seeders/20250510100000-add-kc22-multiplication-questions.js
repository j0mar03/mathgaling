'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC22: Multiplying 2-3 digit numbers by 1-digit numbers"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC22: Multiplying 2-3 digit numbers by 1-digit numbers, with and without regrouping, using place value and standard algorithms'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC22 knowledge component not found, cannot create questions');
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
    // Start with 6100 to avoid conflicts with other seeders (KC21 used 6000-6010)
    let contentId = 6100;

    // Define the new quiz questions for KC22
    const kc22Questions = [
      {
        content: "Ano ang produkto ng (43 X 2)?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["84", "86", "88", "90"],
        correct_answer: "B",
        explanation: "Gamit ang place value, hatiin ang 43: (40 + 3). Paramihin: (40 X 2 = 80), (3 X 2 = 6). Idagdag: (80 + 6 = 86). Walang regrouping dahil ang mga produkto ay hindi lalampas sa 9 sa bawat place value. Kaya, ang Answer ay 86.",
        hint: "Gamitin ang place value. Hatiin ang 43 sa 40 at 3, paramihin ang bawat bahagi sa 2, at idagdag ang mga produkto. Suriin kung walang regrouping."
      },
      {
        content: "Ano ang Answer sa (245 X 5)?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["1215", "1225", "1235", "1245"],
        correct_answer: "B",
        explanation: "Isahan: (5 X 5 = 25), isulat ang 5, i-regroup ang 2 sa sampuan. Sampuan: (4 X 5 = 20 + 2 (mula sa regrouping) = 22), isulat ang 2, i-regroup ang 2 sa sandaanan. Sandaanan: (2 X 5 = 10 + 2 (mula sa regrouping) = 12), isulat ang 12. Resulta: 1225. Halimbawa, kung 245 ang bilang ng sapatos sa isang tindahan sa Marikina at pinarami sa 5, ito ang kabuuan.",
        hint: "Gamitin ang standard na algoritmo. Paramihin ang bawat digit ng 245 (mula isahan hanggang sandaanan) sa 5, at tandaan ang regrouping kung kinakailangan."
      },
      {
        content: "May 7 araw sa isang linggo. Ilang araw ang mayroon sa 15 linggo?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["75", "85", "95", "105"],
        correct_answer: "D",
        explanation: "Isahan: (5 X 7 = 35), isulat ang 5, i-regroup ang 3 sa sampuan. Sampuan: (1 X 7 = 7 + 3 (mula sa regrouping) = 10), isulat ang 0, i-regroup ang 1 sa sandaanan. Resulta: 105 (1 sandaanan, 0 sampuan, 5 isahan). Kaya, (15 X 7 = 105) araw.",
        hint: "I-multiply ang 15 sa 7 gamit ang place value o standard na algoritmo. Suriin kung may regrouping sa sampuan."
      },
      {
        content: "Si Macoy ay nakakagawa ng 183 pares ng sapatos sa isang linggo. Ilang pares ng sapatos ang kaya niyang gawin sa 4 na linggo?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["180", "720", "732", "752"],
        correct_answer: "C",
        explanation: "Gamit ang place value: (183 = 100 + 80 + 3). Isahan: (3 X 4 = 12), isulat ang 2, i-regroup ang 1. Sampuan: (8 X 4 = 32 + 1 = 33), isulat ang 3, i-regroup ang 3. Sandaanan: (1 X 4 = 4 + 3 = 7), isulat ang 7. Resulta: 732. Kaya, 732 pares ng sapatos ang nagawa ni Macoy.",
        hint: "I-multiply ang 183 sa 4. Gamitin ang place value para hatiin ang 183 sa 100, 80, at 3, at paramihin ang bawat bahagi. Suriin ang regrouping."
      },
      {
        content: "Bibili si Josef ng 16 na piraso ng ensaymada sa panaderya. Kung ang isang piraso ay nagkakahalaga ng Php 8.00, magkano ang kanyang babayaran?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["Php 128.00", "Php 124.00", "Php 120.00", "Php 116.00"],
        correct_answer: "A",
        explanation: "Isahan: (6 X 8 = 48), isulat ang 8, i-regroup ang 4. Sampuan: (1 X 8 = 8 + 4 = 12), isulat ang 12. Resulta: 128. Kaya, ang kabuuang babayaran ni Josef ay Php 128.00 para sa 16 na ensaymada.",
        hint: "I-multiply ang 16 sa 8 gamit ang standard na algoritmo. Tandaan ang regrouping sa sampuan."
      },
      {
        content: "Ano ang produkto ng (23 X 3)?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["66", "69", "72", "75"],
        correct_answer: "B",
        explanation: "Isahan: (3 X 3 = 9), isulat ang 9, walang regrouping. Sampuan: (2 X 3 = 6), isulat ang 6. Resulta: 69. Halimbawa, kung 23 ang bilang ng Everlasting sa isang pinggan at 3 pinggan ang inihanda sa Marikina, 69 ang kabuuan.",
        hint: "Gamitin ang standard na algoritmo. Paramihin ang bawat digit ng 23 sa 3, at tandaan ang regrouping kung kinakailangan."
      },
      {
        content: "Ilan ang 7 pangkat ng 54?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["368", "378", "388", "398"],
        correct_answer: "B",
        explanation: "Isahan: (4 X 7 = 28), isulat ang 8, i-regroup ang 2. Sampuan: (5 X 7 = 35 + 2 = 37), isulat ang 7, i-regroup ang 3 sa sandaanan. Sandaanan: 3 (mula sa regrouping), isulat ang 3. Resulta: 378. Kaya, 7 pangkat ng 54 ay 378.",
        hint: "I-multiply ang 54 sa 7 gamit ang place value o standard na algoritmo. Suriin ang regrouping sa sampuan at isahan."
      },
      {
        content: "Ang Lions Club ay nagdonate ng 8 kahon ng aklat sa Paaralang Elementarya ng Andres Bonifacio. Bawat kahon ay may 25 piraso ng aklat. Ilang piraso ng aklat ang naidonate?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["190", "200", "210", "220"],
        correct_answer: "B",
        explanation: "Isahan: (5 X 8 = 40), isulat ang 0, i-regroup ang 4. Sampuan: (2 X 8 = 16 + 4 = 20), isulat ang 20. Resulta: 200. Kaya, 200 piraso ng aklat ang naidonate ng Lions Club.",
        hint: "I-multiply ang 25 sa 8. Gamitin ang standard na algoritmo at suriin kung may regrouping."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc22Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC22 multiplication questions`);
    }

    console.log('Successfully created KC22 multiplication questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6100 to 6110)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6100 AND id < 6110`
    );
  }
}; 