'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find the specific knowledge component "KC21: Applying properties of multiplication"
    const knowledgeComponents = await queryInterface.sequelize.query(
      `SELECT id, name FROM knowledge_components WHERE name = 'KC21: Applying properties of multiplication (commutative, distributive, associative) to solve number sentences and verify equivalence'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('KC21 knowledge component not found, cannot create questions');
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
    // Start with 6000 to avoid conflicts with other seeders
    let contentId = 6000;

    // Define the new quiz questions for KC21
    const kc21Questions = [
      {
        content: "Ano ang nawawalang factor sa (4 X 6 = __ X 4)?",
        type: "multiple_choice",
        difficulty: 2,
        options: ["4", "5", "6", "7"],
        correct_answer: "C",
        explanation: "Ang kakanyahang komutatibo ay nagsasabi na (4 X 6 = 6 X 4). Parehong 24 ang resulta ng dalawang ekspresyon. Kaya, ang nawawalang factor sa (4 X 6 = __ X 4) ay 6.",
        hint: "Ayon sa kakanyahang komutatibo, hindi nagbabago ang produkto kahit baligtarin ang mga factor. Kung (4 X 6 = 24), anong bilang ang kapag pinarami sa 4 ay magiging 24?"
      },
      {
        content: "Aling pamilang na pangungusap ang may parehong produkto ng ((5 X 3) X 2 = N)?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["(5 X (3 + 2) = N)", "(5 X (3 X 2) = N)", "(5 + (3 X 2) = N)", "(5 + (3 + 2) = N)"],
        correct_answer: "B",
        explanation: "Sinasabi ng kakanyahang asosyatibo na ((a X b) X c = a X (b X c)). Sa ((5 X 3) X 2), kalkulahin ang (5 X 3 = 15), pagkatapos ay (15 X 2 = 30). Ang opsyon B, (5 X (3 X 2)), ay may kalkulasyon na (3 X 2 = 6), pagkatapos (5 X 6 = 30), na katumbas nito. Ang mga opsyon A, C, at D ay may kinalaman sa pagdaragdag, na hindi naaangkop sa pagpaparami.",
        hint: "Pinapayagan ng kakanyahang asosyatibo ang pagpapangkat ng mga factor nang hindi nagbabago ang produkto. I-kompyut ang ((5 X 3) X 2) at hanapin ang opsyon na magbibigay ng parehong resulta."
      },
      {
        content: "Kung ang (7 X 6 = 42), ano ang Answer sa (6 X 7)?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["24", "42", "67", "76"],
        correct_answer: "B",
        explanation: "Ang kakanyahang komutatibo ay nagsasabi na (a X b = b X a). Dahil (7 X 6 = 42), kaya (6 X 7 = 42) rin.",
        hint: "Tinitiyak ng kakanyahang komutatibo na pareho ang produkto kahit baligtarin ang mga factor. Kung (7 X 6 = 42), ano ang ibig sabihin nito para sa (6 X 7)?"
      },
      {
        content: "Anong kakanyahan ng pagpaparami ang ipinapakita sa pamilang na pangungusap na (23 X 4 = (20 X 4) + (3 X 4))?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["Kakanyahang Komutatibo", "Kakanyahang Pamamahagi", "Kakanyahang Asosyatibo", "Wala sa nabanggit"],
        correct_answer: "B",
        explanation: "Ang kakanyahang pamamahagi ay nagsasabi na (a X (b + c) = (a X b) + (a X c)). Dito, ang (23 X 4) ay ipinahayag bilang ((20 X 4) + (3 X 4)), kung saan ang 23 ay hinati sa (20 + 3), at ang 4 ay ibinahagi sa bawat bahagi. Halimbawa, (20 X 4 = 80), (3 X 4 = 12), at (80 + 12 = 92), na katumbas ng (23 X 4 = 92).",
        hint: "Ang kakanyahang pamamahagi ay nangangailangan ng paghahati ng bilang sa mga bahagi at pagpaparami ng bawat bahagi nang hiwalay. Suriin kung hinati ang 23 sa mga bahagi at pinarami sa 4."
      },
      {
        content: "Alin sa mga sumusunod ang tamang pagpapakita ng kakanyahang pamamahagi ng pagpaparami?",
        type: "multiple_choice",
        difficulty: 3,
        options: ["(23 X 4 = (20 X 4) X (3 X 4))", "(23 X 4 = (20 X 4) + (3 X 4))", "(23 X 4 = (20 X 4) - (3 X 4))", "(23 X 4 = (20 X 4) ÷ (3 X 4))"],
        correct_answer: "B",
        explanation: "Kalkulahin ang (23 X 4 = 92). Sa opsyon B, ((20 X 4) + (3 X 4) = 80 + 12 = 92), na tama. Ang opsyon A ay gumagamit ng pagpaparami sa halip na pagdaragdag ((80 X 12 = 960)), ang opsyon C ay gumagamit ng pagbabawas ((80 - 12 = 68)), at ang opsyon D ay gumagamit ng paghahati ((80 ÷ 12 ≈ 6.67)), na hindi katumbas ng 92. Kaya, ang opsyon B lamang ang tamang nagpapakita ng kakanyahang pamamahagi.",
        hint: "Ang kakanyahang pamamahagi ay nangangailangan ng pagdaragdag ng mga produkto ng mga hinati na termino. Suriin ang bawat opsyon sa pamamagitan ng pagkalkula ng kaliwa at kanang bahagi upang makita kung alin ang nananatiling pareho."
      },
      {
        content: "Kumpletuhin ang pamilang na pangungusap upang maipakita ang kakanyahang asosyatibo: ((2 X 7) X __ = 2 X (7 X 3)).",
        type: "multiple_choice",
        difficulty: 2,
        options: ["2", "3", "7", "14"],
        correct_answer: "B",
        explanation: "Sinasabi ng kakanyahang asosyatibo na ((a X b) X c = a X (b X c)). Sa ((2 X 7) X __ = 2 X (7 X 3)), ang nawawalang factor ay 3, dahil ((2 X 7) X 3 = 2 X (7 X 3)). Parehong katumbas ng (2 X 7 X 3 = 42) ang dalawang panig, na nagpapatunay ng pagkakatumbas.",
        hint: "Ang kakanyahang asosyatibo ay tungkol sa pagpapangkat ng mga factor. Ang kanang bahagi ay (2 X (7 X 3)), kaya anong bilang sa kaliwa ang gagawing tama ang ekwasyon?"
      },
      {
        content: "Hanapin ang nawawalang bilang sa ekwasyon ng kakanyahang pamamahagi: (27 X 5 = (__ X 5) + (7 X 5)).",
        type: "multiple_choice",
        difficulty: 2,
        options: ["20", "27", "5", "7"],
        correct_answer: "A",
        explanation: "Ang kakanyahang pamamahagi ay nangangailangan ng (27 X 5 = (a X 5) + (7 X 5)), kung saan (a + 7 = 27). Kaya, (a = 20). Suriin: (27 X 5 = 135), at ((20 X 5) + (7 X 5) = 100 + 35 = 135), na tama. Halimbawa, kung ikaw ay bumili ng 27 piraso ng sapatos sa Marikina na tig-5 piso, ang kabuuan ay pareho kung hihiwalayin mo ito sa 20 at 7 na grupo.",
        hint: "Hatiin ang 27 sa dalawang bahagi kung saan ang isang bahagi ay 7, at ang kabuuan ng mga bahagi ay 27. Pagkatapos, ilapat ang kakanyahang pamamahagi."
      },
      {
        content: "Aling pamilang na pangungusap ang katumbas ng (8 X 10 = 10 X 8)?",
        type: "multiple_choice",
        difficulty: 1,
        options: ["(8 + 10 = 10 + 8)", "(8 X 10 = 80)", "(10 X 8 = 80)", "Parehong B at C"],
        correct_answer: "D",
        explanation: "Ang kakanyahang komutatibo ay nagsasabi na (8 X 10 = 10 X 8), at pareho itong 80. Ang opsyon B ((8 X 10 = 80)) at opsyon C ((10 X 8 = 80)) ay tamang mga pamilang na pangungusap na nagpapakita ng pagkakatumbas na ito. Ang opsyon A ay tungkol sa pagdaragdag, na hindi nauugnay dito. Halimbawa, kung maghahanda ka ng 8 grupo ng 10 Everlasting para sa isang okasyon sa Marikina, pareho ang bilang kahit baligtarin ang pagkakasunod.",
        hint: "Ipinapakita ng kakanyahang komutatibo na ang pagpapalit ng mga factor ay nagbibigay ng parehong produkto. Suriin kung aling mga opsyon ang nagpapakita ng produkto ng (8 X 10)."
      }
    ];

    // Prepare content items for insertion
    const contentItemsToCreate = kc21Questions.map(question => ({
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
      console.log(`Created ${contentItemsToCreate.length} KC21 multiplication properties questions`);
    }

    console.log('Successfully created KC21 multiplication properties questions');
  },

  async down(queryInterface, Sequelize) {
    // Remove our added content items
    // Remove all added content items (IDs 6000 to 6010)
    await queryInterface.sequelize.query(
      `DELETE FROM content_items WHERE id >= 6000 AND id < 6010`
    );
  }
}; 