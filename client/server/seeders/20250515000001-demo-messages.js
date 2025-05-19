'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentDate = new Date();
    
    // Get existing teacher IDs
    const teachers = await queryInterface.sequelize.query(
      'SELECT id FROM "teachers" LIMIT 3;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Get existing student IDs
    const students = await queryInterface.sequelize.query(
      'SELECT id FROM "students" LIMIT 5;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Only proceed if we have at least one teacher and one student
    if (teachers.length === 0 || students.length === 0) {
      console.log('No teachers or students found. Skipping message seeds.');
      return;
    }

    // Create demo messages
    const messages = [];
    
    // Add a few messages from teacher to student
    for (let i = 0; i < Math.min(teachers.length, 2); i++) {
      for (let j = 0; j < Math.min(students.length, 3); j++) {
        messages.push({
          from_user_id: teachers[i].id,
          from_user_type: 'teacher',
          to_user_id: students[j].id,
          to_user_type: 'student',
          message: `Hello! I noticed your recent progress in math. Keep up the good work!`,
          read: Math.random() > 0.5, // Randomly mark some as read
          sent_at: new Date(currentDate.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random date within last week
          createdAt: currentDate,
          updatedAt: currentDate
        });
      }
    }
    
    // Add some student responses
    for (let j = 0; j < Math.min(students.length, 2); j++) {
      messages.push({
        from_user_id: students[j].id,
        from_user_type: 'student',
        to_user_id: teachers[0].id,
        to_user_type: 'teacher',
        message: `Thank you for your help! I've been practicing the problems you suggested.`,
        read: false,
        sent_at: new Date(currentDate.getTime() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000), // Random date within last 3 days
        createdAt: currentDate,
        updatedAt: currentDate
      });
    }

    // Insert the messages
    await queryInterface.bulkInsert('messages', messages, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('messages', null, {});
  }
}; 