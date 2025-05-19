'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC33: Dividing 2- to 3-digit numbers by 2-digit numbers"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC33:Dividing 2- to 3-digit numbers by 2-digit numbers, with or without remainders'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC33 knowledge component not found, cannot create questions');
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
    // Start with 6800 to avoid conflicts with other seeders 
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, KC27: 6500-6510, KC28: 6600-6610, KC32: 6700-6710)
    let contentId = 6800;

    // Define the new quiz questions for KC33
    const kc33Questions = [
      {
        content: "Ano ang Answer sa (322 ÷ 14)?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["20", "21", "22", "23"],
        correct_answer: "D",
        explanation: "Ang tanong ay humihingi ng quotient ng (322 ÷ 14). Hakbang 1 (Divide): Ilang 14 ang kailangan sa 322? Subukang 23, dahil (14 X 23 = 322). Long division:\n   23\n14|322\n   28  (14 × 2 = 28)\n   ---\n    42\n    42  (14 × 3 = 42)\n    ---\n     0\nHakbang 2 (Multiply): (14 X 2 = 28), (14 X 3 = 42). Hakbang 3 (Subtract): (32 - 28 = 4), (42 - 42 = 0). Hakbang 4 (Bring down): Ibaba ang 2, pagkatapos ay wala nang ibababa. Resulta: (322 ÷ 14 = 23), walang remainder. Ang iba pang opsyon ay hindi tama: (14 X 20 = 280), kulang. (14 X 21 = 294), kulang. (14 X 22 = 308), kulang. Halimbawa, sa isang tindahan ng sapatos sa Marikina, kung 322 pares ay hinati sa 14 na kahon, bawat kahon ay magkakaroon ng 23 pares. Kaya, ang tamang Answer ay D.",
        hint: "Gamitin ang mga hakbang sa paghahati (D-M-S-B). Ilang beses na 14 ang kailangan upang maabot o malapitan ang 322? Suriin kung may remainder."
      },
      {
        content: "Kung ang 89 ay hahatiin sa 12, ilan ang remainder?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["4", "5", "6", "7"],
        correct_answer: "B",
        explanation: "Ang tanong ay humihingi ng remainder ng (89 ÷ 12). Long division:\n   7\n12|89\n   84  (12 × 7 = 84)\n   ---\n    5\nHakbang 1 (Divide): Ilang 12 ang kailangan sa 89? Subukang 7, dahil (12 X 7 = 84). Hakbang 2 (Multiply): (12 X 7 = 84). Hakbang 3 (Subtract): (89 - 84 = 5). Hakbang 4 (Bring down): Wala nang ibababa, kaya ang remainder ay 5. Resulta: (89 ÷ 12 = 7) na may remainder na 5. Ang iba pang opsyon ay hindi tama: (12 X 7 = 84), (89 - 84 = 5), hindi 4, 6, o 7. Halimbawa, kung 89 na mangga ay hinati sa 12 na basket, 7 basket ang mapupuno ng 12 mangga, at 5 mangga ang matitira. Kaya, ang tamang Answer ay B.",
        hint: "Gamitin ang long division. Hanapin ang pinakamalaking quotient na posible kapag hinati ang 89 sa 12, at kalkulahin ang natitira."
      },
      {
        content: "Si Mila ay may 453 piraso ng facemasks. Binigyan niya ng pantay na bilang ng facemasks ang 15 nars. Ilang facemasks ang natitira kay Mila?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["1", "2", "3", "4"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng remainder ng (453 ÷ 15). Long division:\n   30\n15|453\n   45  (15 × 3 = 45)\n   ---\n    03\n    00  (15 × 0 = 0)\n    ---\n     3\nHakbang 1 (Divide): Ilang 15 ang kailangan sa 45? Subukang 3, dahil (15 X 3 = 45). Hakbang 2 (Multiply): (15 X 3 = 45). Hakbang 3 (Subtract): (45 - 45 = 0). Hakbang 4 (Bring down): Ibaba ang 3, pagkatapos ay wala nang ibababa. Resulta: (453 ÷ 15 = 30) na may remainder na 3. Ang iba pang opsyon ay hindi tama: (15 X 30 = 450), (453 - 450 = 3), hindi 1, 2, o 4. Halimbawa, sa isang health center sa Marikina, kung 453 facemasks ay ibinahagi sa 15 nars, 3 facemasks ang matitira. Kaya, ang tamang Answer ay C.",
        hint: "Gamitin ang long division upang hatiin ang 453 sa 15. Kalkulahin ang quotient at remainder upang malaman ang natitira."
      },
      {
        content: "Kung ang 99 ay hahatiin sa 14, ilan ang remainder?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["1", "2", "3", "4"],
        correct_answer: "A",
        explanation: "Ang tanong ay humihingi ng remainder ng (99 ÷ 14). Long division:\n   7\n14|99\n   98  (14 × 7 = 98)\n   ---\n    1\nHakbang 1 (Divide): Ilang 14 ang kailangan sa 99? Subukang 7, dahil (14 X 7 = 98). Hakbang 2 (Multiply): (14 X 7 = 98). Hakbang 3 (Subtract): (99 - 98 = 1). Hakbang 4 (Bring down): Wala nang ibababa, kaya ang remainder ay 1. Resulta: (99 ÷ 14 = 7) na may remainder na 1. Ang iba pang opsyon ay hindi tama: (14 X 7 = 98), (99 - 98 = 1), hindi 2, 3, o 4. Halimbawa, kung 99 na pandesal ay hinati sa 14 na basket, 7 basket ang mapupuno, at 1 pandesal ang matitira. Kaya, ang tamang Answer ay A.",
        hint: "Gamitin ang long division. Hanapin ang quotient ng 99 ÷ 14, at kalkulahin ang natitira pagkatapos ng paghahati."
      },
      {
        content: "Ano ang Answer sa (468 ÷ 32)?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["14 r. 20", "15 r. 12", "16 r. 4", "17 r. 0"],
        correct_answer: "A",
        explanation: "Ang tanong ay humihingi ng quotient at remainder ng (468 ÷ 32). Long division:\n   14\n32|468\n   32  (32 × 1 = 32)\n   ---\n   148\n   128  (32 × 4 = 128)\n   ---\n    20\nHakbang 1 (Divide): Ilang 32 ang kailangan sa 46? Subukang 1, dahil (32 X 1 = 32). Hakbang 2 (Multiply): (32 X 1 = 32). Hakbang 3 (Subtract): (46 - 32 = 14). Hakbang 4 (Bring down): Ibaba ang 8, kaya 148. Ulitin: Ilang 32 sa 148? Subukang 4, dahil (32 X 4 = 128). Multiply: (32 X 4 = 128). Subtract: (148 - 128 = 20). Resulta: (468 ÷ 32 = 14) na may remainder na 20. Ang iba pang opsyon ay hindi tama: (32 X 15 = 480), sobra. (32 X 16 = 512), sobra. (32 X 17 = 544), sobra. Halimbawa, kung 468 na kuwintas ay hinati sa 32 na kahon, 14 na kahon ang mapupuno, at 20 kuwintas ang matitira. Kaya, ang tamang Answer ay A.",
        hint: "Gamitin ang long division. Kalkulahin ang quotient at remainder ng 468 ÷ 32. Subukang tantyahin ang quotient at suriin ang natitira."
      },
      {
        content: "Si Jose ay may 180 piraso ng laruang kotse. Hinati niya ito nang pantay sa 60 na kahon. Ilang laruang kotse ang bawat kahon?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["2", "3", "4", "5"],
        correct_answer: "B",
        explanation: "Ang tanong ay humihingi ng quotient ng (180 ÷ 60). Long division:\n   3\n60|180\n   180  (60 × 3 = 180)\n   ---\n    0\nHakbang 1 (Divide): Ilang 60 ang kailangan sa 180? Subukang 3, dahil (60 X 3 = 180). Hakbang 2 (Multiply): (60 X 3 = 180). Hakbang 3 (Subtract): (180 - 180 = 0). Hakbang 4 (Bring down): Wala nang ibababa. Resulta: (180 ÷ 60 = 3), walang remainder. Ang iba pang opsyon ay hindi tama: (60 X 2 = 120), kulang. (60 X 4 = 240), sobra. (60 X 5 = 300), sobra. Halimbawa, sa isang toy store sa Marikina, kung 180 laruang kotse ay hinati sa 60 kahon, bawat kahon ay magkakaroon ng 3 laruang kotse. Kaya, ang tamang Answer ay B.",
        hint: "Kalkulahin ang (180 ÷ 60). Gamitin ang long division at tingnan kung may remainder. Kung wala, ang quotient ang Answer."
      },
      {
        content: "Kung 363 piraso ng lapis ay hinati sa 27 na mag-aaral, ilang lapis ang makukuha ng bawat mag-aaral, at ilan ang matitira?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["13 r. 12", "14 r. 9", "15 r. 6", "16 r. 3"],
        correct_answer: "A",
        explanation: "Ang tanong ay humihingi ng quotient at remainder ng (363 ÷ 27). Long division:\n   13\n27|363\n   27  (27 × 1 = 27)\n   ---\n    93\n    81  (27 × 3 = 81)\n    ---\n    12\nHakbang 1 (Divide): Ilang 27 sa 36? Subukang 1, dahil (27 X 1 = 27). Hakbang 2 (Multiply): (27 X 1 = 27). Hakbang 3 (Subtract): (36 - 27 = 9). Hakbang 4 (Bring down): Ibaba ang 3, kaya 93. Ulitin: Ilang 27 sa 93? Subukang 3, dahil (27 X 3 = 81). Multiply: (27 X 3 = 81). Subtract: (93 - 81 = 12). Resulta: (363 ÷ 27 = 13) na may remainder na 12. Ang iba pang opsyon ay hindi tama: (27 X 14 = 378), sobra. (27 X 15 = 405), sobra. (27 X 16 = 432), sobra. Halimbawa, sa isang paaralan sa Marikina, kung 363 lapis ay ibinahagi sa 27 mag-aaral, bawat mag-aaral ay makakakuha ng 13 lapis, at 12 lapis ang matitira. Kaya, ang tamang Answer ay A.",
        hint: "Gamitin ang long division para sa (363 ÷ 27). Kalkulahin ang quotient at remainder upang malaman ang Answer."
      },
      {
        content: "Si Ana ay may 450 na piraso ng kendi. Hinati niya ito nang pantay sa 15 na bata. Ilang kendi ang makukuha ng bawat bata?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["28", "29", "30", "31"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (450 ÷ 15). Long division:\n   30\n15|450\n   45  (15 × 3 = 45)\n   ---\n    00\n    00  (15 × 0 = 0)\n    ---\n     0\nHakbang 1 (Divide): Ilang 15 sa 45? Subukang 3, dahil (15 X 3 = 45). Hakbang 2 (Multiply): (15 X 3 = 45). Hakbang 3 (Subtract): (45 - 45 = 0). Hakbang 4 (Bring down): Ibaba ang 0, kaya 00. Ulitin: Ilang 15 sa 00? 0, dahil (15 X 0 = 0). Resulta: (450 ÷ 15 = 30), walang remainder. Ang iba pang opsyon ay hindi tama: (15 X 28 = 420), kulang. (15 X 29 = 435), kulang. (15 X 31 = 465), sobra. Halimbawa, sa isang pamilihan sa Marikina, kung 450 kendi ay ibinahagi sa 15 bata, bawat bata ay makakakuha ng 30 kendi. Kaya, ang tamang Answer ay C.",
        hint: "Kalkulahin ang (450 ÷ 15). Gamitin ang long division at tingnan kung may remainder. Kung wala, ang quotient ang Answer."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc33Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC33 division questions`);
    }

    console.log('Successfully created KC33 division questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6800 to 6810)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6800 AND id < 6810`
    );
  }
}; 