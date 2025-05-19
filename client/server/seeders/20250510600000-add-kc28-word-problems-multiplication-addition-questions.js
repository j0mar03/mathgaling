'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC28: Solving routine word problems involving multiplication followed by addition"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC28: Solving routine word problems involving multiplication of 2-3 digit numbers by 1-2 digit numbers, followed by addition of the products to find a total quantity, without regrouping in the addition step'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC28 knowledge component not found, cannot create questions');
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
    // Start with 6600 to avoid conflicts with other seeders 
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, KC27: 6500-6510)
    let contentId = 6600;

    // Define the new quiz questions for KC28
    const kc28Questions = [
      {
        content: "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["750", "1000", "1250", "1500"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng stamps nina Carlo at Sam. Ayon sa datos: Si Carlo ay may 250 stamps. Si Sam ay may tatlong beses na mas marami, kaya (250 X 3). Kalkulahin ang stamps ni Sam: (250 X 3 = 750). Idagdag ang stamps ni Carlo at ni Sam: (750 + 250). | libuhan | sandaanan | sampuan | isahan | | | 7 | 5 | 0 | | + | 2 | 5 | 0 | | | 10 | 0 | 0 | Walang regrouping dahil: Isahan: (0 + 0 = 0). Sampuan: (5 + 5 = 10), isulat ang 0, i-carry ang 1 sa sandaanan. Sandaanan: (7 + 2 + 1 = 10), isulat ang 0, i-carry ang 1 sa libuhan. Libuhan: (1 = 1). Resulta: (750 + 250 = 1000). Kaya, ang tamang Answer ay 1000 stamps.",
        hint: "Paramihin ang 250 sa 3 upang mahanap ang bilang ng stamps ni Sam, pagkatapos ay idagdag ang 250 (stamps ni Carlo) sa produkto. Suriin kung walang regrouping sa pagdagdag."
      },
      {
        content: "Si Melinda ay may koleksyon ng 25 ribbons. Ang kanyang ate Mina ay may apat na beses na mas marami kaysa sa kanya. Ilan lahat ang ribbons nilang magkapatid?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["100", "125", "150", "175"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng ribbons nina Melinda at Mina. Ayon sa datos: Si Melinda ay may 25 ribbons. Si Mina ay may apat na beses na mas marami, kaya (25 X 4). Kalkulahin ang ribbons ni Mina: (25 X 4 = 100). Idagdag ang ribbons ni Melinda at ni Mina: (100 + 25). | sandaanan | sampuan | isahan | | 1 | 0 | 0 | | + | 2 | 5 | | 1 | 2 | 5 | Walang regrouping dahil: Isahan: (0 + 5 = 5). Sampuan: (0 + 2 = 2). Sandaanan: (1 + 0 = 1). Resulta: (100 + 25 = 125). Halimbawa, sa isang tindahan ng sinelas sa Marikina, ito ang kabuuang ribbons ng magkapatid. Kaya, ang tamang Answer ay 125 ribbons.",
        hint: "Paramihin ang 25 sa 4 upang mahanap ang bilang ng ribbons ni Mina, pagkatapos ay idagdag ang 25 (ribbons ni Melinda) sa produkto. Tiyaking walang regrouping sa pagdagdag."
      },
      {
        content: "Si Cardo ay may 11 koleksyon ng laruang kotse. Kung ang kaibigan niyang si Lito ay mas marami ng dalawang beses ang bilang ng laruang kotse, ilan lahat ang laruang kotse ng magkaibigan?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["22", "33", "44", "55"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng laruang kotse nina Cardo at Lito. Ayon sa datos: Si Cardo ay may 11 laruang kotse. Si Lito ay may dalawang beses na mas marami, kaya (11 X 2). Kalkulahin ang laruang kotse ni Lito: (11 X 2 = 22). Idagdag ang laruang kotse ni Cardo at ni Lito: (22 + 11). | sampuan | isahan | | 2 | 2 | | + 1 | 1 | | 3 | 3 | Walang regrouping dahil: Isahan: (2 + 1 = 3). Sampuan: (2 + 1 = 3). Resulta: (22 + 11 = 33). Kaya, ang tamang Answer ay 33 laruang kotse.",
        hint: "Paramihin ang 11 sa 2 upang mahanap ang bilang ng laruang kotse ni Lito, pagkatapos ay idagdag ang 11 (koleksyon ni Cardo) sa produkto. Suriin kung walang regrouping."
      },
      {
        content: "Si Ana ay may 100 pares ng sapatos sa kanyang tindahan sa Marikina. Ang kanyang kapatid na si Ben ay may dalawang beses na mas marami. Ilan lahat ang pares ng sapatos ng magkapatid?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["200", "300", "400", "500"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng pares ng sapatos nina Ana at Ben. Ayon sa datos: Si Ana ay may 100 pares ng sapatos. Si Ben ay may dalawang beses na mas marami, kaya (100 X 2). Kalkulahin ang sapatos ni Ben: (100 X 2 = 200). Idagdag ang sapatos ni Ana at ni Ben: (200 + 100). | sandaanan | sampuan | isahan | | 2 | 0 | 0 | | + 1 | 0 | 0 | | 3 | 0 | 0 | Walang regrouping dahil: Isahan: (0 + 0 = 0). Sampuan: (0 + 0 = 0). Sandaanan: (2 + 1 = 3). Resulta: (200 + 100 = 300). Halimbawa, sa isang shoe museum sa Marikina, ito ang kabuuang pares ng sapatos. Kaya, ang tamang Answer ay 300 pares ng sapatos.",
        hint: "Paramihin ang 100 sa 2 upang mahanap ang bilang ng sapatos ni Ben, pagkatapos ay idagdag ang 100 (sapatos ni Ana) sa produkto. Tiyaking walang regrouping."
      },
      {
        content: "Si Jose ay may 50 komiks sa kanyang koleksyon. Ang kanyang kaibigan na si Maria ay may tatlong beses na mas marami. Ilan lahat ang komiks ng dalawa?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["150", "200", "250", "300"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng komiks nina Jose at Maria. Ayon sa datos: Si Jose ay may 50 komiks. Si Maria ay may tatlong beses na mas marami, kaya (50 X 3). Kalkulahin ang komiks ni Maria: (50 X 3 = 150). Idagdag ang komiks ni Jose at ni Maria: (150 + 50). | sandaanan | sampuan | isahan | | 1 | 5 | 0 | | + | 5 | 0 | | 2 | 0 | 0 | Walang regrouping dahil: Isahan: (0 + 0 = 0). Sampuan: (5 + 5 = 10), isulat ang 0, i-carry ang 1. Sandaanan: (1 + 0 + 1 = 2). Resulta: (150 + 50 = 200). Kaya, ang tamang Answer ay 200 komiks.",
        hint: "Paramihin ang 50 sa 3 upang mahanap ang bilang ng komiks ni Maria, pagkatapos ay idagdag ang 50 (komiks ni Jose) sa produkto. Suriin kung walang regrouping."
      },
      {
        content: "Sa isang panaderya sa Marikina, si Mang Pedro ay gumagawa ng 120 pandesal sa isang batch. Ang kanyang anak na si Juan ay gumagawa ng dalawang beses na mas marami. Ilan lahat ang pandesal na ginawa nila?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["240", "360", "480", "600"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng pandesal na ginawa nina Mang Pedro at Juan. Ayon sa datos: Si Mang Pedro ay gumagawa ng 120 pandesal. Si Juan ay gumagawa ng dalawang beses na mas marami, kaya (120 X 2). Kalkulahin ang pandesal ni Juan: (120 X 2 = 240). Idagdag ang pandesal ni Mang Pedro at ni Juan: (240 + 120). | sandaanan | sampuan | isahan | | 2 | 4 | 0 | | + 1 | 2 | 0 | | 3 | 6 | 0 | Walang regrouping dahil: Isahan: (0 + 0 = 0). Sampuan: (4 + 2 = 6). Sandaanan: (2 + 1 = 3). Resulta: (240 + 120 = 360). Kaya, ang tamang Answer ay 360 pandesal.",
        hint: "Paramihin ang 120 sa 2 upang mahanap ang pandesal ni Juan, pagkatapos ay idagdag ang 120 (pandesal ni Mang Pedro) sa produkto. Tiyaking walang regrouping."
      },
      {
        content: "Si Lisa ay may 30 laruang manika sa kanyang koleksyon. Ang kanyang kapatid na si Tina ay may apat na beses na mas marami. Ilan lahat ang laruang manika ng magkapatid?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["120", "150", "180", "210"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng laruang manika nina Lisa at Tina. Ayon sa datos: Si Lisa ay may 30 laruang manika. Si Tina ay may apat na beses na mas marami, kaya (30 X 4). Kalkulahin ang manika ni Tina: (30 X 4 = 120). Idagdag ang manika ni Lisa at ni Tina: (120 + 30). | sandaanan | sampuan | isahan | | 1 | 2 | 0 | | + | 3 | 0 | | 1 | 5 | 0 | Walang regrouping dahil: Isahan: (0 + 0 = 0). Sampuan: (2 + 3 = 5). Sandaanan: (1 + 0 = 1). Resulta: (120 + 30 = 150). Kaya, ang tamang Answer ay 150 laruang manika.",
        hint: "Paramihin ang 30 sa 4 upang mahanap ang bilang ng manika ni Tina, pagkatapos ay idagdag ang 30 (manika ni Lisa) sa produkto. Suriin kung walang regrouping."
      },
      {
        content: "Si Mang Tony ay nag-aani ng 200 mangga sa kanyang puno. Ang kanyang anak na si Rina ay nakapag-ani ng tatlong beses na mas marami. Ilan lahat ang mangga na naani nila?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["400", "600", "800", "1000"],
        correct_answer: "C",
        explanation: "Ang suliranin ay humihingi ng kabuuang bilang ng mangga na naani nina Mang Tony at Rina. Ayon sa datos: Si Mang Tony ay nag-aani ng 200 mangga. Si Rina ay nakapag-ani ng tatlong beses na mas marami, kaya (200 X 3). Kalkulahin ang mangga ni Rina: (200 X 3 = 600). Idagdag ang mangga ni Mang Tony at ni Rina: (600 + 200). | sandaanan | sampuan | isahan | | 6 | 0 | 0 | | + 2 | 0 | 0 | | 8 | 0 | 0 | Walang regrouping dahil: Isahan: (0 + 0 = 0). Sampuan: (0 + 0 = 0). Sandaanan: (6 + 2 = 8). Resulta: (600 + 200 = 800). Halimbawa, sa isang pamilihan sa Marikina, ito ang kabuuang mangga na naani. Kaya, ang tamang Answer ay 800 mangga.",
        hint: "Paramihin ang 200 sa 3 upang mahanap ang mangga ni Rina, pagkatapos ay idagdag ang 200 (mangga ni Mang Tony) sa produkto. Tiyaking walang regrouping."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc28Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC28 word problems multiplication addition questions`);
    }

    console.log('Successfully created KC28 word problems multiplication addition questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6600 to 6610)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6600 AND id < 6610`
    );
  }
}; 