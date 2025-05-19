'use strict';
const db = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();
    const kcCurriculumCode = 'G3-Q2M6-KC30'; // For "KC30: Stating and identifying multiples..."
    let teacherId = null;

    try {
      // Find the teacher (optional, for teacher_id in content_items)
      const teachers = await queryInterface.sequelize.query(
        `SELECT id FROM teachers LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );
      if (teachers.length > 0) {
        teacherId = teachers[0].id;
      } else {
        console.warn("No teacher found in DB, assigning null to teacher_id for new Content Items.");
      }

      // Find the Knowledge Component
      const kc = await db.KnowledgeComponent.findOne({
        where: { curriculum_code: kcCurriculumCode },
        transaction
      });

      if (!kc) {
        console.error(`Knowledge Component with curriculum_code ${kcCurriculumCode} not found. Skipping seeding questions for it.`);
        await transaction.rollback();
        return;
      }

      const questions = [
        {
          content: "Ano ang kasunod na multiple sa pattern na 3, 6, 9, ?",
          options: JSON.stringify(["10", "11", "12", "13"]),
          correct_answer: "12",
          explanation: "Ang pattern ay nagpapakita ng multiples ng 3. Ang kasunod ng 9 ay 12 (3 x 4 = 12).",
          difficulty: 1,
          hint: "Ang pattern ay nagdadagdag ng 3 sa bawat bilang."
        },
        {
          content: "Alin ang nawawalang bilang sa loob ng kahon?\n| 18 | 24 | __ | 36 | 42 |",
          options: JSON.stringify(["30", "34", "36", "38"]),
          correct_answer: "30",
          explanation: "Ang mga bilang ay multiples ng 6. Ang nawawalang bilang sa pagitan ng 24 at 36 ay 30 (6 x 5 = 30).",
          difficulty: 2,
          hint: "Ang pattern ay multiples ng 6."
        },
        {
          content: "Ang 10, 15, 20, 25, ay multiple ng anong bilang?",
          options: JSON.stringify(["1", "3", "5", "7"]),
          correct_answer: "5",
          explanation: "Ang bawat bilang sa sequence ay mahahati nang eksakto sa 5. Ito ay multiples ng 5.",
          difficulty: 1,
          hint: "Anong bilang ang pare-parehong idinadagdag para makuha ang kasunod na bilang, o anong bilang ang maaaring i-multiply para makuha ang mga ito?"
        },
        {
          content: "Kung ang bilang na 24 ay hahatiin sa 6, ano ang sagot?",
          options: JSON.stringify(["4", "6", "8", "10"]),
          correct_answer: "4",
          explanation: "Ang 24 hinati sa 6 ay 4, dahil 6 x 4 = 24.",
          difficulty: 1,
          hint: "Ilang 6 ang kasya sa 24?"
        },
        {
          content: "Si Ryan ay nangolekta ng maliliit na bato para sa kaniyang proyekto. Inayos niya ang dalawampung maliliit na bato sa 4 na paso. Ilang piraso ng maliliit na bato ang nasa bawat paso?",
          options: JSON.stringify(["1", "3", "5", "7"]),
          correct_answer: "5",
          explanation: "Para malaman kung ilan ang bato sa bawat paso, hatiin ang kabuuang bilang ng bato (20) sa bilang ng paso (4). 20 ÷ 4 = 5.",
          difficulty: 2,
          hint: "Hatiin ang kabuuang bilang ng bato sa bilang ng paso."
        },
        {
          content: "Ano ang kasunod na multiple sa pattern na 9, 18, 27, __?",
          options: JSON.stringify(["39", "38", "37", "36"]),
          correct_answer: "36",
          explanation: "Ang pattern ay nagpapakita ng multiples ng 9. Ang kasunod ng 27 ay 36 (9 x 4 = 36).",
          difficulty: 1,
          hint: "Ang pattern ay nagdadagdag ng 9 sa bawat bilang."
        },
        {
          content: "Ang 12, 24, 36, 48, ay multiple ng anong bilang?",
          options: JSON.stringify(["10", "11", "12", "13"]),
          correct_answer: "12",
          explanation: "Ang bawat bilang sa sequence ay mahahati nang eksakto sa 12. Ito ay multiples ng 12.",
          difficulty: 1,
          hint: "Anong bilang ang pare-parehong idinadagdag o ano ang common factor ng mga bilang na ito?"
        },
        {
          content: "May 40 mansanas na hinati sa walong pangkat. Ilan ang mansanas sa bawat pangkat?",
          options: JSON.stringify(["1", "3", "5", "7"]),
          correct_answer: "5",
          explanation: "Para malaman kung ilan ang mansanas sa bawat pangkat, hatiin ang kabuuang bilang ng mansanas (40) sa bilang ng pangkat (8). 40 ÷ 8 = 5.",
          difficulty: 2,
          hint: "Hatiin ang kabuuang bilang ng mansanas sa bilang ng pangkat."
        },
        {
          content: "Ano ang nawawalang bilang sa number sentence na (42 ÷ 6 = ?)",
          options: JSON.stringify(["1", "3", "5", "7"]),
          correct_answer: "7",
          explanation: "Ang 42 hinati sa 6 ay 7, dahil 6 x 7 = 42.",
          difficulty: 1,
          hint: "Ilang 6 ang kasya sa 42?"
        },
        {
          content: "Kung ang bilang na 30 ay hahatiin sa 6, ano ang sagot?",
          options: JSON.stringify(["4", "5", "6", "7"]),
          correct_answer: "5",
          explanation: "Ang 30 hinati sa 6 ay 5, dahil 6 x 5 = 30.",
          difficulty: 1,
          hint: "Ilang 6 ang kasya sa 30?"
        }
      ];

      const contentItemsToInsert = questions.map(q => ({
        knowledge_component_id: kc.id,
        type: 'multiple_choice', // All questions are multiple choice
        content: q.content,
        difficulty: q.difficulty,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        metadata: JSON.stringify({ hint: q.hint }),
        status: 'approved',
        suggestion_source: 'manual',
        language: 'Filipino', // Assuming questions are in Filipino
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
    const kcCurriculumCode = 'G3-Q2M6-KC30';
    try {
      const kc = await db.KnowledgeComponent.findOne({
        where: { curriculum_code: kcCurriculumCode },
        attributes: ['id'],
        transaction
      });

      if (kc) {
        await queryInterface.bulkDelete('content_items', {
          knowledge_component_id: kc.id,
          // Add a more specific condition if these questions have unique text
          // For example, using the content of the first question:
          // content: { [Sequelize.Op.like]: 'Ano ang kasunod na multiple sa pattern na 3, 6, 9, ?%' }
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
