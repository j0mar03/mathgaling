'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Fetch the actual parent ID based on auth_id
    const parent = await queryInterface.sequelize.query(
      `SELECT id FROM parents WHERE auth_id = 'parent-auth-1'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT, plain: true }
    );
    if (!parent) {
      throw new Error("Could not find parent with auth_id 'parent-auth-1'. Ensure the parent seeder ran successfully.");
    }
    const parentId = parent.id;

    // Fetch the actual student ID based on auth_id
    const student = await queryInterface.sequelize.query(
      `SELECT id FROM students WHERE auth_id = 'student-auth-1'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT, plain: true }
    );
    if (!student) {
      throw new Error("Could not find student with auth_id 'student-auth-1'. Ensure the student seeder ran successfully.");
    }
    const studentId = student.id;

    await queryInterface.bulkInsert('parent_students', [{
      parent_id: parentId,
      student_id: studentId
      // No timestamps needed as defined in the model/migration
    }], {});
  },

  async down (queryInterface, Sequelize) {
     // Fetch the actual parent ID
    const parent = await queryInterface.sequelize.query(
      `SELECT id FROM parents WHERE auth_id = 'parent-auth-1'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT, plain: true }
    );
    const parentId = parent ? parent.id : null;

    // Fetch the actual student ID
    const student = await queryInterface.sequelize.query(
      `SELECT id FROM students WHERE auth_id = 'student-auth-1'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT, plain: true }
    );
    const studentId = student ? student.id : null;

    // Delete the link using actual IDs if found
    if (parentId && studentId) {
      await queryInterface.bulkDelete('parent_students', {
        parent_id: parentId,
        student_id: studentId
      }, {});
    }
    // Or delete all:
    // await queryInterface.bulkDelete('parent_students', null, {});
  }
};
