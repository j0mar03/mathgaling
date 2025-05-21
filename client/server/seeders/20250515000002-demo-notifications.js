'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentDate = new Date();
    
    // Get existing student IDs
    const students = await queryInterface.sequelize.query(
      'SELECT id FROM "students" LIMIT 5;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Only proceed if we have at least one student
    if (students.length === 0) {
      console.log('No students found. Skipping notification seeds.');
      return;
    }

    // Create demo notifications
    const notifications = [];
    
    const notificationTypes = ['message', 'assignment', 'feedback', 'system', 'achievement'];
    const titles = [
      'New message from your teacher',
      'New assignment available',
      'Feedback on your recent work',
      'System update',
      'Achievement unlocked!'
    ];
    const messages = [
      'Your teacher has sent you a message.',
      'New math practice assignment has been added to your dashboard.',
      'Your teacher has provided feedback on your recent quiz.',
      'System maintenance complete. New features are now available!',
      'Congratulations! You have mastered Addition skills!'
    ];
    
    // Create a mix of notifications for each student
    for (let i = 0; i < students.length; i++) {
      // Create 3 notifications per student
      for (let j = 0; j < 3; j++) {
        const typeIndex = Math.floor(Math.random() * notificationTypes.length);
        
        notifications.push({
          user_id: students[i].id,
          user_type: 'student',
          title: titles[typeIndex],
          message: messages[typeIndex],
          type: notificationTypes[typeIndex],
          read: Math.random() > 0.7, // Most are unread
          reference_id: j === 0 ? 1 : null, // First notification has a reference, others don't
          created_at: new Date(currentDate.getTime() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000), // Random date within last 10 days
          createdAt: currentDate,
          updatedAt: currentDate
        });
      }
    }

    // Insert the notifications
    await queryInterface.bulkInsert('notifications', notifications, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('notifications', null, {});
  }
}; 