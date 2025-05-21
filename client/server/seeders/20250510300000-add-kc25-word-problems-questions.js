'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC25: Solving routine word problems involving multiplication of 2-3 digit numbers by 2-digit numbers"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC25: Solving routine word problems involving multiplication of 2-3 digit numbers by 2-digit numbers'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC25 knowledge component not found, cannot create questions');
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
    // Start with 6300 to avoid conflicts with other seeders (KC21 used 6000-6010, KC22 used 6100-6110, KC23 used 6200-6210)
    let contentId = 6300;

    // Define the new quiz questions for KC25
    const kc25Questions = [
      {
        content: "Si Ruel ay may 12 basket. Ang bawat basket ay may 21 piraso ng abokado. Ilan lahat ang abokado ni Ruel?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["250", "252", "254", "256"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng abokado mula sa 12 basket, kung saan ang bawat basket ay may 21 abokado. Kaya, kailangang magparami: (12 X 21). Isahan: (2 X 1 = 2), (2 X 20 = 40), pagsamahin: (40 + 2 = 42), isulat ang 2, i-regroup ang 4. Sampuan: (1 X 1 = 1), (1 X 20 = 20), pagsamahin: (20 + 1 + 4 (mula sa regrouping) = 25), isulat ang 25. Resulta: 252. Halimbawa, sa isang pamilihan sa Marikina, ito ang kabuuang abokado ni Ruel. Kaya, ang tamang Answer ay 252 abokado.",
        hint: "Paramihin ang bilang ng basket (12) sa bilang ng abokado bawat basket (21). Gamitin ang standard na algoritmo o distributive property at suriin kung may regrouping."
      },
      {
        content: "Si lolo ay nagbigay ng 23 kendi sa kanyang 12 apo. Ilan ang kabuuang kendi na ipinamigay ni lolo?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["278", "276", "274", "272"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng kendi na ipinamigay sa 12 apo, kung saan ang bawat apo ay nakatanggap ng 23 kendi. Kaya, kailangang magparami: (23 X 12). Ones place: (3 X 2 = 6), (3 X 10 = 30), pagsamahin: (30 + 6 = 36), isulat ang 6, i-regroup ang 3. Tens place: (2 X 2 = 4), (2 X 10 = 20), pagsamahin: (20 + 4 + 3 (mula sa regrouping) = 27), isulat ang 27. Resulta: 276. Kaya, ang kabuuang kendi na ipinamigay ni lolo ay 276. Kaya, ang tamang Answer ay 276 kendi.",
        hint: "Paramihin ang bilang ng kendi bawat apo (23) sa bilang ng apo (12). Gamitin ang short method at suriin ang regrouping sa bawat hakbang."
      },
      {
        content: "May 12 na plato sa mesa. Kung ang bawat plato ay may laman na 13 hotdog, ilan lahat ang piraso ng hotdog?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["154", "156", "158", "160"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng hotdog sa 12 plato, kung saan ang bawat plato ay may 13 hotdog. Kaya, kailangang magparami: (12 X 13). Gamit ang distributive property: (12 = 10 + 2), (13 = 10 + 3). Ones: (2 X 3 = 6), (2 X 10 = 20), pagsamahin: (20 + 6 = 26), isulat ang 6, i-regroup ang 2. Tens: (1 X 3 = 3), (1 X 10 = 10), pagsamahin: (10 + 3 + 2 = 15), isulat ang 15. Resulta: 156. Kaya, ang tamang Answer ay 156 hotdog.",
        hint: "Paramihin ang bilang ng plato (12) sa bilang ng hotdog bawat plato (13). Gamitin ang distributive property method para gawing mas madali ang pagkalkula."
      },
      {
        content: "Si Jun ay may 24 na kahon ng lapis. May laman na 11 lapis sa bawat kahon. Ilang lapis lahat mayroon si Jun?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["262", "264", "266", "268"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng lapis sa 24 na kahon, kung saan ang bawat kahon ay may 11 lapis. Kaya, kailangang magparami: (24 X 11). Ones: (4 X 1 = 4), (4 X 10 = 40), pagsamahin: (40 + 4 = 44), isulat ang 4, i-regroup ang 4. Tens: (2 X 1 = 2), (2 X 10 = 20), pagsamahin: (20 + 2 + 4 = 26), isulat ang 26. Resulta: 264. Halimbawa, sa isang paaralan sa Marikina, ito ang kabuuang lapis ni Jun. Kaya, ang tamang Answer ay 264 lapis.",
        hint: "Paramihin ang bilang ng kahon (24) sa bilang ng lapis bawat kahon (11). Gamitin ang short method at tandaan ang regrouping sa ones at tens place."
      },
      {
        content: "Si Nanay Fely ay nananahi ng 45 damit sa isang araw. Ilang damit kaya ang magagawa niya sa loob ng 25 araw?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["1100", "1125", "1150", "1175"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng damit na magagawa ni Nanay Fely sa 25 araw, kung saan siya ay nananahi ng 45 damit sa isang araw. Kaya, kailangang magparami: (45 X 25). Ones: (5 X 5 = 25), (5 X 20 = 100), pagsamahin: (100 + 25 = 125), isulat ang 5, i-regroup ang 12 (1 sa sandaanan, 2 sa sampuan). Tens: (4 X 5 = 20), (4 X 20 = 80), pagsamahin: (80 + 20 + 12 = 112), isulat ang 2, i-regroup ang 11 sa sandaanan. Sandaanan: 11 + 1 (mula sa ones) = 12, isulat ang 1 (libuhan), 2 (sandaanan). Resulta: 1125. Kaya, ang tamang Answer ay 1125 damit.",
        hint: "Paramihin ang bilang ng damit bawat araw (45) sa bilang ng araw (25). Gamitin ang standard na algoritmo at suriin ang regrouping para sa 3-digit na resulta."
      },
      {
        content: "May 500 na supot ng mani. Ang bawat supot ay may laman na 25 na mani. Ilang lahat ang bilang ng mani?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["12,250", "12,500", "12,750", "13,000"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng mani sa 500 supot, kung saan ang bawat supot ay may 25 mani. Kaya, kailangang magparami: (500 X 25). Dahil ang 500 ay multiple ng 100, sundin ang pamamaraan: I-multiply ang mga bilang na hindi zero: (5 X 25 = 125). Idagdag ang mga zero: (125 + 00 = 12,500). Kaya, ang tamang Answer ay 12,500 mani.",
        hint: "Paramihin ang bilang ng supot (500) sa bilang ng mani bawat supot (25). Gamitin ang pamamaraan para sa multiples ng 10 at idagdag ang mga zero pagkatapos."
      },
      {
        content: "Si Mia ay bumili ng 4 na kahon ng facemask. Bawat kahon ay may 100 piraso. Ilang facemask ang matatanggap ni Mia?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["380", "390", "400", "410"],
        correct_answer: "C",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng facemask mula sa 4 na kahon, kung saan ang bawat kahon ay may 100 facemask. Kaya, kailangang magparami: (4 X 100). Dahil ang 100 ay multiple ng 100, sundin ang pamamaraan: I-multiply ang mga bilang na hindi zero: (4 X 1 = 4). Idagdag ang mga zero: (4 + 00 = 400). Kaya, ang tamang Answer ay 400 facemask.",
        hint: "Paramihin ang bilang ng kahon (4) sa bilang ng facemask bawat kahon (100). Gamitin ang pamamaraan para sa multiples ng 100 at idagdag ang mga zero."
      },
      {
        content: "Si Ana ay naghanda ng 13 pinggan ng Everlasting para sa isang salu-salo sa Marikina. Bawat pinggan ay may 22 piraso ng Everlasting. Ilang piraso ng Everlasting ang inihanda ni Ana?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["284", "286", "288", "290"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng Everlasting sa 13 pinggan, kung saan ang bawat pinggan ay may 22 piraso. Kaya, kailangang magparami: (13 X 22). Gamit ang distributive property: (13 = 10 + 3), (22 = 20 + 2). Resulta: 286. Kaya, ang tamang Answer ay 286 Everlasting.",
        hint: "Paramihin ang bilang ng pinggan (13) sa bilang ng Everlasting bawat pinggan (22). Gamitin ang distributive property o short method at suriin ang regrouping."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc25Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC25 word problems questions`);
    }

    console.log('Successfully created KC25 word problems questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6300 to 6310)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6300 AND id < 6310`
    );
  }
}; 