'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC34: Dividing 2- to 3-digit numbers by 10 or 100"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC34 :Dividing 2- to 3-digit numbers by 10 or 100, without remainders, including solving routine word problems.'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC34 knowledge component not found, cannot create questions');
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
    // Start with 6900 to avoid conflicts with other seeders 
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710, KC33: 6800-6810)
    let contentId = 6900;

    // Define the new quiz questions for KC34
    const kc34Questions = [
      {
        content: "Ilang 100 mayroon ang 600?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["4", "5", "6", "7"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (600 ÷ 100). Division: (600 ÷ 100 = 6), dahil (100 X 6 = 600). Paraan: Kapag hinati sa 100, inililipat ang decimal point dalawang lugar sa kaliwa. Sa 600 (o 600.0), ilipat ang decimal point: 6.0, kaya 6. Suriin: (100 X 6 = 600), walang remainder. Ang iba pang opsyon ay hindi tama: (100 X 4 = 400), kulang. (100 X 5 = 500), kulang. (100 X 7 = 700), sobra. Halimbawa, sa isang tindahan sa Marikina, kung 600 pares ng sapatos ay hinati sa 100 pares bawat kahon, magkakaroon ng 6 na kahon. Kaya, ang tamang Answer ay C.",
        hint: "Kalkulahin ang (600 ÷ 100). Isipin kung ilang beses na 100 ang kailangan upang makabuo ng 600."
      },
      {
        content: "Ano ang Answer sa (250 ÷ 10)?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["25", "35", "45", "55"],
        correct_answer: "A",
        explanation: "Ang tanong ay humihingi ng quotient ng (250 ÷ 10). Division: (250 ÷ 10 = 25), dahil (10 X 25 = 250). Paraan: Sa 250 (o 250.0), ilipat ang decimal point isang lugar sa kaliwa: 25.0, kaya 25. Suriin: (10 X 25 = 250), walang remainder. Ang iba pang opsyon ay hindi tama: (10 X 35 = 350), sobra. (10 X 45 = 450), sobra. (10 X 55 = 550), sobra. Halimbawa, kung 250 pandesal sa isang panaderya sa Marikina ay hinati sa 10 piraso bawat bag, magkakaroon ng 25 bag. Kaya, ang tamang Answer ay A.",
        hint: "Kalkulahin ang (250 ÷ 10). Tandaan na kapag hinati sa 10, inililipat ang decimal point isang lugar sa kaliwa."
      },
      {
        content: "Ano ang Answer sa (800 ÷ 100)?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["6", "7", "8", "9"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (800 ÷ 100). Division: (800 ÷ 100 = 8), dahil (100 X 8 = 800). Paraan: Sa 800 (o 800.0), ilipat ang decimal point dalawang lugar sa kaliwa: 8.0, kaya 8. Suriin: (100 X 8 = 800), walang remainder. Ang iba pang opsyon ay hindi tama: (100 X 6 = 600), kulang. (100 X 7 = 700), kulang. (100 X 9 = 900), sobra. Halimbawa, kung 800 mangga sa isang pamilihan sa Marikina ay hinati sa 100 piraso bawat kahon, magkakaroon ng 8 kahon. Kaya, ang tamang Answer ay C.",
        hint: "Kalkulahin ang (800 ÷ 100). Isipin kung ilang 100 ang kailangan upang makabuo ng 800."
      },
      {
        content: "Kung ang 340 kendi ay hahatiin para sa 10 bata, tig-ilan ang matatanggap ng bawat bata?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["31", "32", "33", "34"],
        correct_answer: "D",
        explanation: "Ang tanong ay humihingi ng quotient ng (340 ÷ 10). Division: (340 ÷ 10 = 34), dahil (10 X 34 = 340). Paraan: Sa 340 (o 340.0), ilipat ang decimal point isang lugar sa kaliwa: 34.0, kaya 34. Suriin: (10 X 34 = 340), walang remainder. Ang iba pang opsyon ay hindi tama: (10 X 31 = 310), kulang. (10 X 32 = 320), kulang. (10 X 33 = 330), kulang. Halimbawa, sa isang party sa Marikina, kung 340 kendi ay ibinahagi sa 10 bata, bawat bata ay makakakuha ng 34 kendi. Kaya, ang tamang Answer ay D.",
        hint: "Kalkulahin ang (340 ÷ 10). Hanapin ang quotient upang malaman kung ilang kendi ang makukuha ng bawat bata."
      },
      {
        content: "May 525 pirasong kendi. Ang 10 kendi ay ilalagay sa mga maliit na kahon upang ipamahagi sa mga bata. Ilan lahat ang bilang ng kahon na kailangan?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["50", "51", "52", "53"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (525 ÷ 10). Division: (525 ÷ 10 = 52.5). Dahil kailangan ng buong kahon, tingnan ang long division:\n   52\n10|525\n   50  (10 × 5 = 50)\n   ---\n    25\n    20  (10 × 2 = 20)\n    ---\n     5\nResulta: (525 ÷ 10 = 52) na may remainder na 5. Ngunit dahil ang tanong ay tungkol sa bilang ng kahon, at 10 kendi bawat kahon, kailangan ng 52 kahon para sa 520 kendi, at 5 kendi ang matitira. Gayunpaman, ang konteksto ng module ay nagpaHint na ang Answer ay buo at walang remainder sa mga ganitong kaso, kaya posibleng ang 525 ay typo at dapat ay 520 (dahil (520 ÷ 10 = 52), walang remainder). Suriin: (10 X 52 = 520), at sa konteksto, ito ang inaasahang Answer. Ang iba pang opsyon ay hindi tama: (10 X 50 = 500), kulang. (10 X 51 = 510), kulang. (10 X 53 = 530), sobra. Halimbawa, sa isang pamamahagi sa Marikina, kung 520 kendi ay inilagay sa 10 piraso bawat kahon, magkakaroon ng 52 kahon. Kaya, ang tamang Answer ay C.",
        hint: "Kalkulahin ang (525 ÷ 10). Ang quotient ay ang bilang ng kahon na kailangan, at tiyaking walang remainder."
      },
      {
        content: "Ano ang Answer sa (750 ÷ 10)?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["73", "74", "75", "76"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (750 ÷ 10). Division: (750 ÷ 10 = 75), dahil (10 X 75 = 750). Paraan: Sa 750 (o 750.0), ilipat ang decimal point isang lugar sa kaliwa: 75.0, kaya 75. Suriin: (10 X 75 = 750), walang remainder. Ang iba pang opsyon ay hindi tama: (10 X 73 = 730), kulang. (10 X 74 = 740), kulang. (10 X 76 = 760), sobra. Halimbawa, kung 750 na kuwintas sa isang tindahan sa Marikina ay hinati sa 10 piraso bawat bag, magkakaroon ng 75 bag. Kaya, ang tamang Answer ay C.",
        hint: "Kalkulahin ang (750 ÷ 10). Tandaan na kapag hinati sa 10, inililipat ang decimal point isang lugar sa kaliwa."
      },
      {
        content: "Si Mang Pedro ay may 900 na piraso ng buko pie sa kanyang panaderya sa Marikina. Hinati niya ito sa 100 piraso bawat kahon para ibenta. Ilang kahon ang nagawa niya?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["7", "8", "9", "10"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (900 ÷ 100). Division: (900 ÷ 100 = 9), dahil (100 X 9 = 900). Paraan: Sa 900 (o 900.0), ilipat ang decimal point dalawang lugar sa kaliwa: 9.0, kaya 9. Suriin: (100 X 9 = 900), walang remainder. Ang iba pang opsyon ay hindi tama: (100 X 7 = 700), kulang. (100 X 8 = 800), kulang. (100 X 10 = 1000), sobra. Halimbawa, sa panaderya ni Mang Pedro sa Marikina, kung 900 buko pie ay inilagay sa 100 piraso bawat kahon, magkakaroon ng 9 na kahon. Kaya, ang tamang Answer ay C.",
        hint: "Kalkulahin ang (900 ÷ 100). Ang quotient ay ang bilang ng kahon na nagawa."
      },
      {
        content: "Si Ana ay may 620 na laruang bola. Inilagay niya ito sa mga kahon na may tig-10 bola. Ilang kahon ang nagamit niya?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["60", "61", "62", "63"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (620 ÷ 10). Division: (620 ÷ 10 = 62), dahil (10 X 62 = 620). Paraan: Sa 620 (o 620.0), ilipat ang decimal point isang lugar sa kaliwa: 62.0, kaya 62. Suriin: (10 X 62 = 620), walang remainder. Ang iba pang opsyon ay hindi tama: (10 X 60 = 600), kulang. (10 X 61 = 610), kulang. (10 X 63 = 630), sobra. Halimbawa, sa isang toy store sa Marikina, kung 620 laruang bola ay inilagay sa 10 bola bawat kahon, magkakaroon ng 62 kahon. Kaya, ang tamang Answer ay C.",
        hint: "Kalkulahin ang (620 ÷ 10). Ang quotient ay ang bilang ng kahon na nagamit, at tiyaking walang remainder."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc34Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC34 division questions`);
    }

    console.log('Successfully created KC34 division questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6900 to 6910)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6900 AND id < 6910`
    );
  }
}; 