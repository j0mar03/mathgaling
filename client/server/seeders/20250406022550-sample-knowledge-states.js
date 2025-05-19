'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Fetch the actual student ID based on auth_id
    const student = await queryInterface.sequelize.query(
      `SELECT id FROM students WHERE auth_id = 'student-auth-1'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT, plain: true }
    );
    if (!student) {
      throw new Error("Could not find student with auth_id 'student-auth-1'. Ensure the student seeder ran successfully.");
    }
    const studentId = student.id;

    // Fetch the actual KC IDs based on curriculum_code
    const kcs = await queryInterface.sequelize.query(
      `SELECT id, curriculum_code FROM knowledge_components WHERE curriculum_code IN ('G3-NS-1', 'G3-NS-2', 'G3-NS-3')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const kcIdMap = kcs.reduce((acc, kc) => {
      acc[kc.curriculum_code] = kc.id;
      return acc;
    }, {});
    const kcIds = ['G3-NS-1', 'G3-NS-2', 'G3-NS-3'].map(code => kcIdMap[code]);

    // Check if all required KCs were found
    if (kcIds.some(id => !id)) {
       throw new Error('Could not find all required Knowledge Components (G3-NS-1, G3-NS-2, G3-NS-3) by curriculum_code. Ensure the KC seeder ran successfully.');
    }

    const states = kcIds.map(kcId => ({
      student_id: studentId,
      knowledge_component_id: kcId,
      p_mastery: 0.3, // Default initial mastery
      p_transit: 0.1, // Default
      p_guess: 0.2,   // Default
      p_slip: 0.1,    // Default
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('knowledge_states', states, {});
  },

  async down (queryInterface, Sequelize) {
    // Fetch the actual student ID
    const student = await queryInterface.sequelize.query(
      `SELECT id FROM students WHERE auth_id = 'student-auth-1'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT, plain: true }
    );
    const studentId = student ? student.id : null; // Handle case where student might not exist

    // Fetch the actual KC IDs
    const kcs = await queryInterface.sequelize.query(
      `SELECT id FROM knowledge_components WHERE curriculum_code IN ('G3-NS-1', 'G3-NS-2', 'G3-NS-3')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const kcIds = kcs.map(kc => kc.id);

    // Delete states using actual IDs if found
    if (studentId && kcIds.length > 0) {
      await queryInterface.bulkDelete('knowledge_states', {
        student_id: studentId,
        knowledge_component_id: { [Sequelize.Op.in]: kcIds }
      }, {});
    }
    // Or delete all:
    // await queryInterface.bulkDelete('knowledge_states', null, {});
  }
};
