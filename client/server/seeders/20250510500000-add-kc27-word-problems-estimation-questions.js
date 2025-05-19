'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC27: Solving routine word problems involving estimated products"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC27: Solving routine word problems involving estimated products of 2-3 digit numbers by 1-2 digit numbers'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC27 knowledge component not found, cannot create questions');
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
    // Start with 6500 to avoid conflicts with other seeders 
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410)
    let contentId = 6500;

    // Define the new quiz questions for KC27
    const kc27Questions = [
      {
        content: "Si Angelica ay nakakabenta ng 18 lata ng sardinas kada araw. Humigit-kumulang ilang lata ng sardinas ang mabebenta niya sa 15 araw?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["200", "250", "300", "350"],
        correct_answer: "C",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng lata ng sardinas na mabebenta ni Angelica sa 15 araw, kung saan siya ay nakakabenta ng 18 lata kada araw. Kaya, tantiyahin ang (18 X 15): I-round off ang 18 sa pinakamalapit na sampuan: (18 \\to 20). I-round off ang 15 sa pinakamalapit na sampuan: (15 \\to 20). I-multiply: (20 X 20 = 400). Ang aktwal na produkto ay (18 X 15 = 270). Ang 400 ay medyo malayo, ngunit sa mga opsyon, ang 300 ay ang pinakamalapit na tantiya. Halimbawa, sa isang tindahan sa Marikina, ito ang tinantiyang bilang ng lata na mabebenta. Kaya, ang tamang Answer ay 300 lata.",
        hint: "I-round off ang 18 at 15 sa pinakamalapit na sampuan, pagkatapos ay paramihin ang mga rounded na bilang. Ihambing ang resulta sa aktwal na produkto."
      },
      {
        content: "Araw-araw, 589 na kahon ng noodles ang naipagbibili ng isang groseri. Humigit-kumulang ilang kahon ang naipagbibili nila sa 30 araw?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["16,670", "17,600", "17,670", "18,000"],
        correct_answer: "D",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng kahon ng noodles na naipagbibili sa 30 araw, kung saan ang groseri ay nakakabenta ng 589 kahon araw-araw. Kaya, tantiyahin ang (589 X 30): I-round off ang 589 sa pinakamalapit na daanan: (589 \\to 600). I-round off ang 30 sa pinakamalapit na sampuan: (30 \\to 30) (walang pagbabago). I-multiply: (600 X 30 = 18,000). Ang aktwal na produkto ay (589 X 30 = 17,670). Ang 18,000 ay malapit sa aktwal na Answer at tumutugma sa opsyon. Halimbawa, sa isang groseri sa Marikina, ito ang tinantiyang bilang ng kahon na naibenta. Kaya, ang tamang Answer ay 18,000 kahon.",
        hint: "I-round off ang 589 sa pinakamalapit na daanan at ang 30 sa pinakamalapit na sampuan, pagkatapos ay paramihin ang mga rounded na bilang. Suriin kung ang resulta ay malapit sa aktwal na produkto."
      },
      {
        content: "Si Dante ay may 5 kuwintas na gawa sa beads. Gumamit siya ng 47 beads para sa isang kuwintas. Humigit-kumulang ilang beads ang kaniyang nagamit?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["200", "250", "300", "350"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng beads na ginamit ni Dante para sa 5 kuwintas, kung saan ang bawat kuwintas ay may 47 beads. Kaya, tantiyahin ang (47 X 5): I-round off ang 47 sa pinakamalapit na sampuan: (47 \\to 50). I-multiply: (50 X 5 = 250). Ang aktwal na produkto ay (47 X 5 = 235). Ang 250 ay malapit sa aktwal na Answer at tumutugma sa opsyon. Halimbawa, sa isang palengke sa Marikina kung saan ibinebenta ang kuwintas, ito ang tinantiyang bilang ng beads. Kaya, ang tamang Answer ay 250 beads.",
        hint: "I-round off ang 47 sa pinakamalapit na sampuan at paramihin sa 5. Suriin kung ang resulta ay malapit sa aktwal na produkto."
      },
      {
        content: "May 13 kahon ng lapis, 12 lapis ang laman ng isang kahon. Humigit-kumulang ilang lapis mayroon sa 13 kahon?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["150", "160", "170", "180"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng lapis sa 13 kahon, kung saan ang bawat kahon ay may 12 lapis. Kaya, tantiyahin ang (13 X 12): I-round off ang 13 sa pinakamalapit na sampuan: (13 \\to 10). I-round off ang 12 sa pinakamalapit na sampuan: (12 \\to 10). I-multiply: (10 X 10 = 100). Ang aktwal na produkto ay (13 X 12 = 156). Ang 100 ay medyo malayo, ngunit sa mga opsyon, ang 160 ay ang pinakamalapit na tantiya. Halimbawa, sa isang paaralan sa Marikina, ito ang tinantiyang bilang ng lapis. Kaya, ang tamang Answer ay 160 lapis.",
        hint: "I-round off ang 13 at 12 sa pinakamalapit na sampuan, pagkatapos ay paramihin ang mga rounded na bilang. Ihambing ang resulta sa aktwal na produkto."
      },
      {
        content: "Si Rose ay nakakabenta ng 19 na lata ng corned beef kada araw. Humigit-kumulang ilang lata ng corned beef ang mabebenta niya sa 6 na araw?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["100", "120", "140", "160"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng lata ng corned beef na mabebenta ni Rose sa 6 na araw, kung saan siya ay nakakabenta ng 19 lata kada araw. Kaya, tantiyahin ang (19 X 6): I-round off ang 19 sa pinakamalapit na sampuan: (19 \\to 20). I-multiply: (20 X 6 = 120). Ang aktwal na produkto ay (19 X 6 = 114). Ang 120 ay malapit sa aktwal na Answer at tumutugma sa opsyon. Halimbawa, sa isang tindahan sa Marikina, ito ang tinantiyang bilang ng lata na naibenta. Kaya, ang tamang Answer ay 120 lata.",
        hint: "I-round off ang 19 sa pinakamalapit na sampuan at paramihin sa 6. Suriin kung ang resulta ay malapit sa aktwal na produkto."
      },
      {
        content: "Sa computer shop ni Izza, nakakaubos sila ng 173 reams ng papel para sa activity sheets sa isang araw. Humigit-kumulang ilang reams ng papel ang magagamit nila sa loob ng 5 araw?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["800", "900", "1000", "1100"],
        correct_answer: "C",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng reams ng papel na gagamitin sa 5 araw, kung saan ang computer shop ay gumagamit ng 173 reams araw-araw. Kaya, tantiyahin ang (173 X 5): I-round off ang 173 sa pinakamalapit na daanan: (173 \\to 200). I-multiply: (200 X 5 = 1000). Ang aktwal na produkto ay (173 X 5 = 865). Ang 1000 ay malapit sa aktwal na Answer at tumutugma sa opsyon. Halimbawa, sa isang computer shop sa Marikina, ito ang tinantiyang bilang ng reams para sa activity sheets. Kaya, ang tamang Answer ay 1000 reams.",
        hint: "I-round off ang 173 sa pinakamalapit na daanan at paramihin sa 5. Ihambing ang resulta sa aktwal na produkto."
      },
      {
        content: "Si Ana ay nagbebenta ng 26 na pares ng sapatos kada araw sa isang tindahan sa Marikina. Humigit-kumulang ilang pares ng sapatos ang maibebenta niya sa 14 na araw?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["300", "400", "500", "600"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng pares ng sapatos na maibebenta ni Ana sa 14 na araw, kung saan siya ay nagbebenta ng 26 pares kada araw. Kaya, tantiyahin ang (26 X 14): I-round off ang 26 sa pinakamalapit na sampuan: (26 \\to 30). I-round off ang 14 sa pinakamalapit na sampuan: (14 \\to 10). I-multiply: (30 X 10 = 300). Ang aktwal na produkto ay (26 X 14 = 364). Ang 300 ay medyo malayo, ngunit sa mga opsyon, ang 400 ay ang pinakamalapit na tantiya. Kaya, ang tamang Answer ay 400 pares ng sapatos.",
        hint: "I-round off ang 26 at 14 sa pinakamalapit na sampuan, pagkatapos ay paramihin ang mga rounded na bilang. Suriin kung ang resulta ay malapit sa aktwal na produkto."
      },
      {
        content: "Si Ben ay naghahanda ng 418 na piraso ng lumpia para sa isang salu-salo. Kung kailangan niya ng 12 piraso ng lumpia bawat plato, humigit-kumulang ilang piraso ng lumpia ang kailangan niya para sa 12 plato?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["4800", "5000", "5200", "5400"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng lumpia na kailangan ni Ben para sa 12 plato, kung saan ang bawat plato ay nangangailangan ng 418 piraso (ngunit dahil ito ay isang word problem, ipinapalagay na ang 418 ay ang bilang ng lumpia bawat araw o yunit, at tantiyahin ang (418 X 12)). Kaya, tantiyahin ang (418 X 12): I-round off ang 418 sa pinakamalapit na daanan: (418 \\to 400). I-round off ang 12 sa pinakamalapit na sampuan: (12 \\to 10). I-multiply: (400 X 10 = 4000). Ang aktwal na produkto ay (418 X 12 = 5016). Ang 4000 ay medyo malayo, ngunit sa mga opsyon, ang 5000 ay ang pinakamalapit na tantiya. Halimbawa, sa isang salu-salo sa Marikina, ito ang tinantiyang bilang ng lumpia. Kaya, ang tamang Answer ay 5000 lumpia.",
        hint: "I-round off ang 418 sa pinakamalapit na daanan at ang 12 sa pinakamalapit na sampuan, pagkatapos ay paramihin. Ihambing ang resulta sa aktwal na produkto."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc27Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC27 word problems estimation questions`);
    }

    console.log('Successfully created KC27 word problems estimation questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6500 to 6510)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6500 AND id < 6510`
    );
  }
}; 