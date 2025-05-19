'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC32: Visualizing and stating division facts for numbers up to 100"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC32 : Visualizing and stating division facts for numbers up to 100 divided by numbers 1 to 10'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC32 knowledge component not found, cannot create questions');
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
    // Start with 6700 to avoid conflicts with other seeders 
    // (KC21: 6000-6010, KC22: 6100-6110, KC23: 6200-6210, KC25: 6300-6310, KC26: 6400-6410, KC27: 6500-6510, KC28: 6600-6610)
    let contentId = 6700;

    // Define the new quiz questions for KC32
    const kc32Questions = [
      {
        content: "Ano ang angkop na division sentence para sa larawang ito? (Larawan: 12 na bituin na nahati sa 4 na grupo, bawat grupo ay may 3 bituin.)",
        type: "multiple_choice",
        difficulty: 2,
        options: ["(12 ÷ 4 = 3)", "(4 ÷ 4 = 1)", "(12 ÷ 3 = 4)", "(12 ÷ 3 = 3)"],
        correct_answer: "A",
        explanation: "Sa larawan, ang 12 bituin ay nahati sa 4 na grupo, at bawat grupo ay may 3 bituin. Ang division sentence na tumutugma dito ay (12 ÷ 4 = 3), dahil hinati ang kabuuang bilang ng bituin (12) sa bilang ng grupo (4), at ang Answer ay ang bilang ng bituin sa bawat grupo (3). Halimbawa, sa isang klase sa Marikina, kung 12 mag-aaral ay hinati sa 4 na grupo, bawat grupo ay magkakaroon ng 3 mag-aaral. Kaya, ang tamang Answer ay A.",
        hint: "Tingnan ang larawan. Ilang grupo ang ginawa mula sa 12 bituin? Ilan ang bituin sa bawat grupo? Gamitin ito upang mahanap ang tamang division sentence."
      },
      {
        content: "Ano ang division sentence para sa 5, 4, at 20?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["(20 ÷ 4 = 5)", "(20 ÷ 4 = 4)", "(20 ÷ 5 = 4)", "(20 ÷ 5 = 5)"],
        correct_answer: "A",
        explanation: "Ang tanong ay humihingi ng division sentence gamit ang mga bilang 5, 4, at 20. Sinusuri natin ang mga pagpipilian: (20 ÷ 4 = 5): Kung 20 ang hinati sa 4 na grupo, bawat grupo ay magkakaroon ng 5 (20 ÷ 4 = 5). Suriin natin ang visualization: Kung may 20 kendi at hinati sa 4 na bata, bawat bata ay makakakuha ng 5 kendi. Ito ay tumutugma sa (20 ÷ 4 = 5). Ang iba pang opsyon ay hindi tama: (20 ÷ 4 ≠ 4), (20 ÷ 5 = 4), hindi 5, (20 ÷ 5 ≠ 5). Kaya, ang tamang Answer ay A.",
        hint: "Alamin kung alin sa 5 at 4 ang divisor at quotient kapag ang dividend ay 20. Subukang isipin ang 20 na nahati sa 4 na grupo o 5 na grupo."
      },
      {
        content: "Alin ang nawawalang bilang sa division sentence? (63 ÷ 9 = __)",
        type: "multiple_choice",
        difficulty: 2,
        options: ["6", "7", "8", "9"],
        correct_answer: "B",
        explanation: "Ang division sentence ay (63 ÷ 9 = N). Kailangan nating hanapin ang quotient. Visualization: Kung may 63 na lapis at hinati sa 9 na grupo, ilang lapis ang bawat grupo? Kalkulahin: (9 X 7 = 63), kaya (63 ÷ 9 = 7). Suriin: (63 ÷ 9 = 7), dahil 9 na grupo ng 7 ay eksaktong 63. Ang iba pang opsyon ay hindi tama: (9 X 6 = 54), hindi 63. (9 X 8 = 72), sobra. (9 X 9 = 81), sobra rin. Halimbawa, sa isang tindahan ng sapatos sa Marikina, kung 63 pares ay hinati sa 9 na kahon, bawat kahon ay magkakaroon ng 7 pares. Kaya, ang tamang Answer ay B.",
        hint: "Isipin kung ilang beses na 9 ang kailangan upang makabuo ng 63. Subukang mag-visualize ng 63 na bagay na nahati sa 9 na grupo."
      },
      {
        content: "Ano ang division sentence para sa 6, 3, at 18?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["(18 ÷ 3 = 6)", "(18 ÷ 4 = 6)", "(18 ÷ 3 = 18)", "(18 ÷ 3 = 3)"],
        correct_answer: "A",
        explanation: "Ang tanong ay humihingi ng division sentence gamit ang mga bilang 6, 3, at 18. Sinusuri natin ang mga pagpipilian: (18 ÷ 3 = 6): Kung 18 ang hinati sa 3 na grupo, bawat grupo ay magkakaroon ng 6 (18 ÷ 3 = 6). Visualization: Kung may 18 na pandesal sa isang panaderya sa Marikina at hinati sa 3 na basket, bawat basket ay magkakaroon ng 6 pandesal. Ang iba pang opsyon ay hindi tama: (18 ÷ 4 ≠ 6), (18 ÷ 3 ≠ 18), (18 ÷ 3 ≠ 3). Kaya, ang tamang Answer ay A.",
        hint: "Alamin kung alin sa 6 at 3 ang divisor at quotient kapag ang dividend ay 18. Isipin ang 18 na nahati sa 3 o 6 na grupo."
      },
      {
        content: "Isulat ang nawawalang bilang: (24 ÷ __ = 4)",
        type: "multiple_choice",
        difficulty: 3,
        options: ["4", "5", "6", "7"],
        correct_answer: "C",
        explanation: "Ang division sentence ay (24 ÷ N = 4). Kailangan nating hanapin ang divisor. Visualization: Kung may 24 na bulaklak at hinati sa mga grupo na may tig-4 na bulaklak, ilang grupo ang makukuha? Kalkulahin: (24 ÷ 4 = 6), kaya ang divisor ay 6, dahil 6 na grupo ng 4 ay 24. Suriin: (24 ÷ 6 = 4), tama. Ang iba pang opsyon ay hindi tama: (24 ÷ 4 = 6), hindi 4. (24 ÷ 5 = 4.8), hindi buong bilang. (24 ÷ 7 \\approx 3.43), hindi 4. Kaya, ang tamang Answer ay C.",
        hint: "Hanapin ang bilang na kapag hinati ang 24 ay magbibigay ng quotient na 4. Subukang mag-visualize ng 24 na bagay na nahati sa ilang grupo."
      },
      {
        content: "Kung may 32 na libro at hinati sa 8 na estante, ilang libro ang bawat estante?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["2", "3", "4", "5"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng bilang ng libro sa bawat estante. Division sentence: (32 ÷ 8 = N). Visualization: Kung 32 libro ay hinati sa 8 estante, bawat estante ay magkakaroon ng parehong bilang ng libro. Kalkulahin: (8 X 4 = 32), kaya (32 ÷ 8 = 4). Suriin: 8 estante na may tig-4 na libro ay (8 X 4 = 32). Ang iba pang opsyon ay hindi tama: (8 X 2 = 16), kulang. (8 X 3 = 24), kulang. (8 X 5 = 40), sobra. Halimbawa, sa isang aklatan sa Marikina, kung 32 libro ay inilagay sa 8 estante, bawat estante ay magkakaroon ng 4 na libro. Kaya, ang tamang Answer ay C.",
        hint: "Isipin ang 32 na libro na pantay na hinati sa 8 estante. Ano ang division sentence? Subukang i-visualize ang mga libro sa mga estante."
      },
      {
        content: "Ano ang quotient ng (45 ÷ 5)?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["7", "8", "9", "10"],
        correct_answer: "C",
        explanation: "Ang tanong ay humihingi ng quotient ng (45 ÷ 5). Visualization: Kung may 45 na mangga at hinati sa 5 na basket, ilang mangga ang bawat basket? Kalkulahin: (5 X 9 = 45), kaya (45 ÷ 5 = 9). Suriin: 5 grupo ng 9 ay (5 X 9 = 45). Ang iba pang opsyon ay hindi tama: (5 X 7 = 35), kulang. (5 X 8 = 40), kulang. (5 X 10 = 50), sobra. Kaya, ang tamang Answer ay C.",
        hint: "Isipin kung ilang beses na 5 ang kailangan upang makabuo ng 45. Subukang mag-visualize ng 45 na bagay na nahati sa 5 grupo."
      },
      {
        content: "Kung may 28 na kuwintas at hinati sa 7 na bata, ilang kuwintas ang makukuha ng bawat bata?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["3", "4", "5", "6"],
        correct_answer: "B",
        explanation: "Ang tanong ay humihingi ng bilang ng kuwintas bawat bata. Division sentence: (28 ÷ 7 = N). Visualization: Kung 28 kuwintas ay hinati sa 7 bata, bawat bata ay magkakaroon ng parehong bilang. Kalkulahin: (7 X 4 = 28), kaya (28 ÷ 7 = 4). Suriin: 7 bata na may tig-4 na kuwintas ay (7 X 4 = 28). Ang iba pang opsyon ay hindi tama: (7 X 3 = 21), kulang. (7 X 5 = 35), sobra. (7 X 6 = 42), sobra. Halimbawa, sa isang palengke sa Marikina, kung 28 kuwintas ay ibinahagi sa 7 bata, bawat bata ay makakakuha ng 4 na kuwintas. Kaya, ang tamang Answer ay B.",
        hint: "Hanapin ang quotient ng (28 ÷ 7). Isipin ang 28 na kuwintas na pantay na hinati sa 7 bata."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc32Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC32 division facts questions`);
    }

    console.log('Successfully created KC32 division facts questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6700 to 6710)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6700 AND id < 6710`
    );
  }
}; 