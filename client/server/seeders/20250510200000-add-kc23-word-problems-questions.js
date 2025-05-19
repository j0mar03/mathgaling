'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC23: Solving routine word problems involving multiplication"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC23: Solving routine word problems involving multiplication of 2-3 digit numbers by 1-digit numbers, including money calculations'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC23 knowledge component not found, cannot create questions');
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
    // Start with 6200 to avoid conflicts with other seeders (KC21 used 6000-6010, KC22 used 6100-6110)
    let contentId = 6200;

    // Define the new quiz questions for KC23
    const kc23Questions = [
      {
        content: "May 7 araw sa loob ng isang linggo. Ilang araw mayroon sa 15 linggo?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["75", "85", "95", "105"],
        correct_answer: "D",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng araw sa 15 linggo, kung saan ang isang linggo ay may 7 araw. Kaya, kailangang magparami: (15 X 7). Isahan: (5 X 7 = 35), isulat ang 5, i-regroup ang 3 sa sampuan. Sampuan: (1 X 7 = 7 + 3 (mula sa regrouping) = 10), isulat ang 0, i-regroup ang 1 sa sandaanan. Resulta: 105 (1 sandaanan, 0 sampuan, 5 isahan). Kaya, ang tamang Answer ay 105 araw.",
        hint: "Upang malaman ang kabuuang bilang ng araw, paramihin ang bilang ng araw sa isang linggo (7) sa bilang ng linggo (15). Gamitin ang standard na algoritmo at suriin kung may regrouping."
      },
      {
        content: "Si Macoy ay nakakagawa ng 183 pares ng sapatos sa loob ng isang linggo. Ilang pares ng sapatos ang kaya niyang gawin sa loob ng 4 na linggo?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["180", "720", "732", "752"],
        correct_answer: "C",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng pares ng sapatos sa 4 na linggo, kung saan si Macoy ay nakakagawa ng 183 pares sa isang linggo. Kaya, kailangang magparami: (183 X 4). Isahan: (3 X 4 = 12), isulat ang 2, i-regroup ang 1. Sampuan: (8 X 4 = 32 + 1 = 33), isulat ang 3, i-regroup ang 3. Sandaanan: (1 X 4 = 4 + 3 = 7), isulat ang 7. Resulta: 732. Halimbawa, sa industriya ng sapatos sa Marikina, ito ang kabuuang nagawa ni Macoy. Kaya, ang tamang Answer ay 732 pares ng sapatos.",
        hint: "Paramihin ang bilang ng pares ng sapatos na nagagawa ni Macoy sa isang linggo (183) sa bilang ng linggo (4). Gamitin ang place value o standard na algoritmo, at suriin ang regrouping."
      },
      {
        content: "Bibili si Josef ng 16 na piraso ng ensaymada sa panaderya. Kung ang isang piraso nito ay nagkakahalaga ng Php 8.00, magkano lahat ang kanyang babayaran?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["Php 128.00", "Php 124.00", "Php 120.00", "Php 116.00"],
        correct_answer: "A",
        explanation: "Ang suliranin ay humihingi ng kabuuang halaga ng 16 na ensaymada, na bawat isa ay Php 8.00. Kaya, kailangang magparami: (16 X 8). Isahan: (6 X 8 = 48), isulat ang 8, i-regroup ang 4. Sampuan: (1 X 8 = 8 + 4 = 12), isulat ang 12. Resulta: 128. Kaya, ang kabuuang halaga ay (128 X 1.00 = Php 128.00). Halimbawa, sa isang panaderya sa Marikina, ito ang babayaran ni Josef. Kaya, ang tamang Answer ay Php 128.00.",
        hint: "Upang malaman ang kabuuang halaga, paramihin ang bilang ng ensaymada (16) sa presyo ng bawat isa (Php 8.00). Gamitin ang standard na algoritmo at suriin ang regrouping."
      },
      {
        content: "Si Maria ay gagawa ng 12 baso ng calamansi juice. Upang makagawa nito, kailangang pigain ang 4 na piraso ng calamansi sa bawat baso. Ilan lahat ang calamansi na kailangan niyang gamitin?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["40", "48", "56", "64"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng calamansi para sa 12 baso, kung saan ang bawat baso ay nangangailangan ng 4 na calamansi. Kaya, kailangang magparami: (12 X 4). Isahan: (2 X 4 = 8), isulat ang 8, walang regrouping. Sampuan: (1 X 4 = 4), isulat ang 4. Resulta: 48. Kaya, si Maria ay kakailanganin ng 48 calamansi. Halimbawa, sa isang pagtitipon sa Marikina, ito ang bilang ng calamansi para sa juice. Kaya, ang tamang Answer ay 48 calamansi.",
        hint: "Paramihin ang bilang ng baso (12) sa bilang ng calamansi bawat baso (4). Gamitin ang standard na algoritmo at suriin kung may regrouping."
      },
      {
        content: "Ang Lions Club ay nagdonate ng 8 kahon ng aklat sa Paaralang Elementarya ng Andres Bonifacio. Bawat kahon ay may 25 piraso ng aklat. Ilang piraso ng aklat ang naidonate?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["190", "200", "210", "220"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng aklat na naidonate mula sa 8 kahon, kung saan ang bawat kahon ay may 25 aklat. Kaya, kailangang magparami: (25 X 8). Isahan: (5 X 8 = 40), isulat ang 0, i-regroup ang 4. Sampuan: (2 X 8 = 16 + 4 = 20), isulat ang 20. Resulta: 200. Kaya, 200 piraso ng aklat ang naidonate ng Lions Club sa paaralan sa Marikina. Kaya, ang tamang Answer ay 200 aklat.",
        hint: "Paramihin ang bilang ng kahon (8) sa bilang ng aklat bawat kahon (25). Gamitin ang standard na algoritmo at suriin ang regrouping."
      },
      {
        content: "Bibili si Flor ng 25 piraso ng pianono. Kung ang isang piraso nito ay nagkakahalaga ng Php 4.00, magkano ang kanyang babayaran?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["Php 80.00", "Php 90.00", "Php 100.00", "Php 110.00"],
        correct_answer: "C",
        explanation: "Ang suliranin ay humihingi ng kabuuang halaga ng 25 pianono, na bawat isa ay Php 4.00. Kaya, kailangang magparami: (25 X 4). Isahan: (5 X 4 = 20), isulat ang 0, i-regroup ang 2. Sampuan: (2 X 4 = 8 + 2 = 10), isulat ang 10. Resulta: 100. Kaya, ang kabuuang halaga ay (100 X 1.00 = Php 100.00). Halimbawa, sa isang tindahan sa Marikina, ito ang babayaran ni Flor. Kaya, ang tamang Answer ay Php 100.00.",
        hint: "Paramihin ang bilang ng pianono (25) sa presyo ng bawat isa (Php 4.00). Gamitin ang standard na algoritmo at suriin ang regrouping."
      },
      {
        content: "Inayos ni Maribeth ang mga libro na nakalagay sa book shelves. Bawat istante ay mayroong 62 piraso ng libro. Ilang libro ang kanyang inayos sa 9 na istante?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["548", "558", "568", "578"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng libro sa 9 na istante, kung saan ang bawat istante ay may 62 libro. Kaya, kailangang magparami: (62 X 9). Isahan: (2 X 9 = 18), isulat ang 8, i-regroup ang 1. Sampuan: (6 X 9 = 54 + 1 = 55), isulat ang 5, i-regroup ang 5 sa sandaanan. Sandaanan: 5 (mula sa regrouping), isulat ang 5. Resulta: 558. Kaya, si Maribeth ay nag-ayos ng 558 libro. Kaya, ang tamang Answer ay 558 libro.",
        hint: "Paramihin ang bilang ng libro bawat istante (62) sa bilang ng istante (9). Gamitin ang standard na algoritmo at suriin ang regrouping."
      },
      {
        content: "Ang isang dosena ay katumbas ng 12 piraso. Ilang piraso ng itlog ang mayroon sa 5 dosena?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["48", "60", "72", "84"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng itlog sa 5 dosena, kung saan ang isang dosena ay may 12 itlog. Kaya, kailangang magparami: (12 X 5). Isahan: (2 X 5 = 10), isulat ang 0, i-regroup ang 1. Sampuan: (1 X 5 = 5 + 1 = 6), isulat ang 6. Resulta: 60. Kaya, may 60 itlog sa 5 dosena. Halimbawa, sa isang pamilihan sa Marikina, ito ang bilang ng itlog na bibilhin para sa Everlasting. Kaya, ang tamang Answer ay 60 itlog.",
        hint: "Paramihin ang bilang ng piraso sa isang dosena (12) sa bilang ng dosena (5). Gamitin ang standard na algoritmo at suriin kung may regrouping."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc23Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC23 word problems questions`);
    }

    console.log('Successfully created KC23 word problems questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6200 to 6210)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6200 AND id < 6210`
    );
  }
}; 