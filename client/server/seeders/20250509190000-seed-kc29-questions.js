'use strict';
const db = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();
    const kcCurriculumCode = 'G3-Q2M5-KC29'; // For "KC29: Identifying the components of a routine word problem..."
    let teacherId = null;

    try {
      const teachers = await queryInterface.sequelize.query(
        `SELECT id FROM teachers LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );
      if (teachers.length > 0) {
        teacherId = teachers[0].id;
      } else {
        console.warn("No teacher found in DB, assigning null to teacher_id for new Content Items.");
      }

      const kc = await db.KnowledgeComponent.findOne({
        where: { curriculum_code: kcCurriculumCode },
        transaction
      });

      if (!kc) {
        console.error(`Knowledge Component with curriculum_code ${kcCurriculumCode} not found. Skipping seeding questions for it. Ensure '20250509100000-seed-grade3-sequential-kcs.js' has run.`);
        await transaction.rollback();
        return;
      }

      const questions = [
        // Problem 1
        {
          content: "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang tinatanong sa suliranin?",
          options: JSON.stringify([
            "bilang ng panadero sa Marikina Bakery",
            "bilang ng pandesal na kayang gawin sa loob ng isang oras",
            "bilang ng pandesal na kayang gawin sa loob ng isang araw",
            "bilang ng pandesal na kayang gawin sa loob ng 6 na oras"
          ]),
          correct_answer: "D",
          explanation: "Ang suliranin ay nagtatanong kung gaano karaming pandesal ang magagawa sa loob ng 6 na oras.",
          difficulty: 1,
          hint: "Hanapin ang tanong na direktang sinasagot ng problema."
        },
        {
          content: "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang mga datos na ibinigay sa suliranin?",
          options: JSON.stringify([
            "panadero sa Marikina Bakery",
            "240 pandesal sa isang oras, 6 na oras",
            "240 pandesal sa isang araw, 6 na oras",
            "240 pandesal sa isang oras, 6 na araw"
          ]),
          correct_answer: "B",
          explanation: "Ang mga ibinigay na impormasyon ay ang bilis ng paggawa (240 pandesal/oras) at ang kabuuang oras (6 na oras).",
          difficulty: 1,
          hint: "Aling mga numero at unit ang mahalaga para masagot ang tanong?"
        },
        {
          content: "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAnong operation sa Matematika ang gagamitin sa suliraning ito?",
          options: JSON.stringify(["Addition", "Multiplication", "Subtraction", "Division"]),
          correct_answer: "B",
          explanation: "Dahil paulit-ulit na idadagdag ang bilang ng pandesal na nagagawa kada oras (o ang rate ay ibinigay para sa isang unit at kailangan para sa maraming units), multiplication ang gagamitin.",
          difficulty: 2,
          hint: "Kung ang isang bagay ay ginagawa nang paulit-ulit sa loob ng isang panahon, anong operation ang angkop?"
        },
        {
          content: "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang angkop na pamilang na pangungusap o number sentence sa suliraning pamilang?",
          options: JSON.stringify(["240+6=N", "240−6=N", "240×6=N", "240÷6=N"]),
          correct_answer: "C",
          explanation: "Ang bilang ng pandesal kada oras (240) ay imu-multiply sa bilang ng oras (6) para makuha ang kabuuan.",
          difficulty: 2,
          hint: "Paano mo isusulat ang problema gamit ang mga numero at operation symbol?"
        },
        {
          content: "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang tamang sagot?",
          options: JSON.stringify(["240 pandesal", "1440 pandesal", "3840 pandesal", "4400 pandesal"]),
          correct_answer: "B",
          explanation: "240 pandesal/oras × 6 na oras = 1440 pandesal.",
          difficulty: 2,
          hint: "Kalkulahin ang resulta ng number sentence na 240 × 6."
        },
        // Problem 2
        {
          content: "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nAno ang tinatanong sa suliranin?",
          options: JSON.stringify([
            "Bilang ng stamps ni Sam",
            "Bilang ng stamps ni Carlo",
            "Bilang ng stamps ng magkapatid",
            "Ilang beses na mas maraming stamps kay Sam"
          ]),
          correct_answer: "C",
          explanation: "Ang pangunahing tanong ng suliranin ay ang kabuuang bilang ng stamps ng magkapatid (Carlo at Sam).",
          difficulty: 1,
          hint: "Ano ang huling tanong na kailangang sagutin ng problema?"
        },
        {
          content: "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nAno ang mga nakalahad o ibinigay na datos?",
          options: JSON.stringify([
            "Carlo, Sam",
            "Carlo na may 250 stamps",
            "Sam na may tatlong beses na mas maraming stamps",
            "Carlo na may 250 stamps, Sam na may tatlong beses na mas maraming stamps"
          ]),
          correct_answer: "D",
          explanation: "Ang mga mahalagang datos ay ang bilang ng stamps ni Carlo (250) at ang impormasyon na ang stamps ni Sam ay tatlong beses nito.",
          difficulty: 1,
          hint: "Anu-anong impormasyon ang ibinigay na magagamit mo sa paglutas ng problema?"
        },
        {
          content: "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nIlang stamps mayroon si Carlo?",
          options: JSON.stringify(["200", "205", "250", "2500"]),
          correct_answer: "C",
          explanation: "Ayon sa suliranin, si Carlo ay mayroong 250 stamps.",
          difficulty: 1,
          hint: "Basahin nang mabuti ang unang pangungusap ng problema para sa impormasyon tungkol kay Carlo."
        },
        {
          content: "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nIlang stamps mayroon si Sam?",
          options: JSON.stringify(["250", "500", "750", "1000"]),
          correct_answer: "C",
          explanation: "Ang stamps ni Sam ay tatlong beses ng stamps ni Carlo (250). Kaya, 250 × 3 = 750 stamps.",
          difficulty: 2,
          hint: "Ang 'tatlong beses na mas marami' ay nangangahulugan ng multiplication (pagpaparami)."
        },
        {
          content: "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nIlan lahat ang stamps ng magkapatid?",
          options: JSON.stringify(["250", "500", "750", "1000"]),
          correct_answer: "D",
          explanation: "Para makuha ang kabuuan, pagsamahin ang stamps ni Carlo (250) at ang stamps ni Sam (750). 250 + 750 = 1000 stamps.",
          difficulty: 2,
          hint: "Pagsamahin ang bilang ng stamps ni Carlo at ang bilang ng stamps ni Sam na iyong na-calculate."
        }
      ];

      const contentItemsToInsert = questions.map(q => ({
        knowledge_component_id: kc.id,
        type: 'multiple_choice',
        content: q.content,
        difficulty: q.difficulty,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        metadata: JSON.stringify({ hint: q.hint }),
        status: 'approved',
        suggestion_source: 'manual',
        language: 'Filipino',
        teacher_id: teacherId,
        createdAt: now,
        updatedAt: now
      }));

      if (contentItemsToInsert.length > 0) {
        await queryInterface.bulkInsert('content_items', contentItemsToInsert, { transaction });
        console.log(`Successfully seeded ${contentItemsToInsert.length} questions for KC: ${kcCurriculumCode}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(`Error seeding questions for KC ${kcCurriculumCode}:`, error);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const kcCurriculumCode = 'G3-Q2M5-KC29';
    try {
      const kc = await db.KnowledgeComponent.findOne({
        where: { curriculum_code: kcCurriculumCode },
        attributes: ['id'],
        transaction
      });

      if (kc) {
        // A more robust down migration might involve storing the IDs of the created questions
        // or matching based on specific content if these questions are unique.
        // For simplicity, this will attempt to delete based on KC and content similarity.
        const questionContents = [
          "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang tinatanong sa suliranin?",
          "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang mga datos na ibinigay sa suliranin?",
          "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAnong operation sa Matematika ang gagamitin sa suliraning ito?",
          "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang angkop na pamilang na pangungusap o number sentence sa suliraning pamilang?",
          "Ang panadero sa isang panaderya ay nakagagawa ng 240 pandesal sa isang oras, ilang pandesal ang kaya niyang gawin sa loob ng 6 na oras?\n\nAno ang tamang sagot?",
          "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nAno ang tinatanong sa suliranin?",
          "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nAno ang mga nakalahad o ibinigay na datos?",
          "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nIlang stamps mayroon si Carlo?",
          "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nIlang stamps mayroon si Sam?",
          "Si Carlo ay mayroong 250 stamps. Mas marami ng tatlong beses ang bilang ng stamps ni Sam. Ilan lahat ang stamps ng magkapatid?\n\nIlan lahat ang stamps ng magkapatid?"
        ];
        await queryInterface.bulkDelete('content_items', {
          knowledge_component_id: kc.id,
          content: { [Sequelize.Op.in]: questionContents }
        }, { transaction });
        console.log(`Attempted to delete questions for KC: ${kcCurriculumCode}`);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(`Error reverting seed for KC ${kcCurriculumCode} questions:`, error);
      throw error;
    }
  }
};
