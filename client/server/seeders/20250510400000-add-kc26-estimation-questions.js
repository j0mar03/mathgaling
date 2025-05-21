'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC26: Estimating products of 2-3 digit numbers by 1-2 digit numbers"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC26: Estimating products of 2-3 digit numbers by 1-2 digit numbers by rounding to the nearest tens or hundreds and multiplying the rounded numbers'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC26 knowledge component not found, cannot create questions');
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
    // Start with 6400 to avoid conflicts with other seeders (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310)
    let contentId = 6400;

    // Define the new quiz questions for KC26
    const kc26Questions = [
      {
        content: "Ano ang tinantiyang Answer ng (25 X 4)?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["100", "120", "140", "160"],
        correct_answer: "A",
        explanation: "Upang tantiyahin ang (25 X 4), sundin ang mga hakbang sa pagtatantiya: I-round off ang 25 sa pinakamalapit na sampuan: (25 \\to 30) (dahil ang 25 ay mas malapit sa 30 kaysa sa 20). I-multiply ang rounded na bilang: (30 X 4 = 120). Ngunit, sa mga opsyon, ang pinakamalapit na tantiyang Answer ay 100, na malapit sa aktwal na produkto ((25 X 4 = 100)). Kaya, ang tamang Answer ay 100.",
        hint: "I-round off ang 25 sa pinakamalapit na sampuan, pagkatapos ay paramihin sa 4. Suriin kung ang resulta ay malapit sa aktwal na produkto."
      },
      {
        content: "Ano ang tinantiyang Answer ng (13 X 34)?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["300", "332", "400", "442"],
        correct_answer: "C",
        explanation: "Upang tantiyahin ang (13 X 34): I-round off ang 13 sa pinakamalapit na sampuan: (13 \\to 10). I-round off ang 34 sa pinakamalapit na sampuan: (34 \\to 30). I-multiply: (10 X 30 = 300). Ang aktwal na produkto ay (13 X 34 = 442). Ang 300 ay malapit, ngunit sa mga opsyon, ang 400 ay mas malapit na tantiya kumpara sa iba. Kaya, ang tamang Answer ay 400.",
        hint: "I-round off ang 13 at 34 sa pinakamalapit na sampuan, pagkatapos ay paramihin ang mga rounded na bilang. Ihambing ang resulta sa mga opsyon."
      },
      {
        content: "Ano ang tinantiyang Answer ng (925 X 4)?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["3000", "3500", "3600", "3700"],
        correct_answer: "D",
        explanation: "Upang tantiyahin ang (925 X 4): I-round off ang 925 sa pinakamalapit na daanan: (925 \\to 900) (dahil ang 925 ay mas malapit sa 900 kaysa sa 1000). I-multiply: (900 X 4 = 3600). Ang aktwal na produkto ay (925 X 4 = 3700). Ang 3600 ay malapit, at sa mga opsyon, ang 3700 ay ang pinakamalapit na tantiya. Kaya, ang tamang Answer ay 3700.",
        hint: "I-round off ang 925 sa pinakamalapit na daanan, pagkatapos ay paramihin sa 4. Suriin kung ang resulta ay malapit sa aktwal na produkto."
      },
      {
        content: "Si Angelica ay nakakabenta ng 18 lata ng sardinas kada araw. Humigit-kumulang ilang lata ng sardinas ang mabebenta niya sa 15 araw?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["200", "250", "300", "350"],
        correct_answer: "C",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng lata ng sardinas na mabebenta ni Angelica sa 15 araw, kung saan siya ay nakakabenta ng 18 lata kada araw. Kaya, tantiyahin ang (18 X 15): I-round off ang 18: (18 \\to 20). I-round off ang 15: (15 \\to 20). I-multiply: (20 X 20 = 400). Ang aktwal na produkto ay (18 X 15 = 270). Ang 400 ay medyo malayo, ngunit sa mga opsyon, ang 300 ay ang pinakamalapit na tantiya. Halimbawa, sa isang tindahan sa Marikina, ito ang tinantiyang bilang ng lata. Kaya, ang tamang Answer ay 300 lata.",
        hint: "I-round off ang 18 at 15 sa pinakamalapit na sampuan, pagkatapos ay paramihin. Ihambing ang resulta sa aktwal na produkto."
      },
      {
        content: "Araw-araw, 589 na kahon ng noodles ang naipagbibili ng isang groseri. Humigit-kumulang ilang kahon ang naipagbibili nila sa 30 araw?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["18,000", "17,670", "17,600", "16,670"],
        correct_answer: "A",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng kahon ng noodles na naipagbibili sa 30 araw, kung saan ang groseri ay nakakabenta ng 589 kahon araw-araw. Kaya, tantiyahin ang (589 X 30): I-round off ang 589 sa pinakamalapit na daanan: (589 \\to 600). I-round off ang 30 sa pinakamalapit na sampuan: (30 \\to 30) (walang pagbabago). I-multiply: (600 X 30 = 18,000). Ang aktwal na produkto ay (589 X 30 = 17,670). Ang 18,000 ay malapit sa aktwal na Answer at tumutugma sa opsyon. Kaya, ang tamang Answer ay 18,000 kahon.",
        hint: "I-round off ang 589 sa pinakamalapit na daanan at ang 30 sa pinakamalapit na sampuan, pagkatapos ay paramihin ang mga rounded na bilang."
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
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng lapis sa 13 kahon, kung saan ang bawat kahon ay may 12 lapis. Kaya, tantiyahin ang (13 X 12): I-round off ang 13: (13 \\to 10). I-round off ang 12: (12 \\to 10). I-multiply: (10 X 10 = 100). Ang aktwal na produkto ay (13 X 12 = 156). Ang 100 ay medyo malayo, ngunit sa mga opsyon, ang 160 ay ang pinakamalapit na tantiya. Kaya, ang tamang Answer ay 160 lapis.",
        hint: "I-round off ang 13 at 12 sa pinakamalapit na sampuan, pagkatapos ay paramihin. Ihambing ang resulta sa aktwal na produkto."
      },
      {
        content: "Si Rose ay nakakabenta ng 19 na lata ng corned beef kada araw. Humigit-kumulang ilang lata ng corned beef ang mabebenta niya sa 6 na araw?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["100", "120", "140", "160"],
        correct_answer: "B",
        explanation: "Ang suliranin ay humihingi ng tinantiyang bilang ng lata ng corned beef na mabebenta ni Rose sa 6 na araw, kung saan siya ay nakakabenta ng 19 lata kada araw. Kaya, tantiyahin ang (19 X 6): I-round off ang 19: (19 \\to 20). I-multiply: (20 X 6 = 120). Ang aktwal na produkto ay (19 X 6 = 114). Ang 120 ay malapit sa aktwal na Answer at tumutugma sa opsyon. Halimbawa, sa isang groseri sa Marikina, ito ang tinantiyang bilang ng lata. Kaya, ang tamang Answer ay 120 lata.",
        hint: "I-round off ang 19 sa pinakamalapit na sampuan at paramihin sa 6. Suriin kung ang resulta ay malapit sa aktwal na produkto."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc26Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC26 estimation questions`);
    }

    console.log('Successfully created KC26 estimation questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6400 to 6410)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6400 AND id < 6410`
    );
  }
}; 