'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, get the teacher ID
    const teacher = await queryInterface.sequelize.query(
      `SELECT id FROM teachers WHERE auth_id = 'teacher-auth-1'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT, plain: true }
    );
    if (!teacher) {
      throw new Error("Could not find teacher with auth_id 'teacher-auth-1'. Ensure the teacher seeder ran successfully.");
    }
    const teacherId = teacher.id;

    // Create a classroom for the teacher if it doesn't exist
    const existingClassroom = await queryInterface.sequelize.query(
      `SELECT id FROM classrooms WHERE teacher_id = :teacherId LIMIT 1`,
      { 
        replacements: { teacherId },
        type: queryInterface.sequelize.QueryTypes.SELECT, 
        plain: true 
      }
    );

    let classroomId;
    if (existingClassroom) {
      classroomId = existingClassroom.id;
    } else {
      // Insert a new classroom
      const newClassroom = await queryInterface.bulkInsert('classrooms', [{
        teacher_id: teacherId,
        name: 'Grade 3 Mathematics',
        settings: JSON.stringify({
          allowRetakes: true,
          adaptiveDifficulty: true
        })
        // Timestamps are added automatically
      }], { returning: true });
      
      if (Array.isArray(newClassroom)) {
        classroomId = newClassroom[0].id;
      } else {
        // Get the newly created classroom ID
        const classroom = await queryInterface.sequelize.query(
          `SELECT id FROM classrooms WHERE teacher_id = :teacherId ORDER BY id DESC LIMIT 1`,
          { 
            replacements: { teacherId },
            type: queryInterface.sequelize.QueryTypes.SELECT, 
            plain: true 
          }
        );
        classroomId = classroom.id;
      }
    }

    // Get all existing students
    const students = await queryInterface.sequelize.query(
      `SELECT id FROM students`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create classroom-student associations for each student
    const classroomStudents = students.map(student => ({
      classroom_id: classroomId,
      student_id: student.id
      // No timestamps needed
    }));

    // Insert the associations
    await queryInterface.bulkInsert('classroom_students', classroomStudents);
    
    console.log(`Added ${students.length} students to classroom ID ${classroomId}`);
  },

  async down (queryInterface, Sequelize) {
    // Delete all classroom-student associations
    await queryInterface.bulkDelete('classroom_students', null, {});
  }
};
