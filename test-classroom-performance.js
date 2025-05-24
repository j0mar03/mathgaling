// Test script to verify classroom performance endpoint returns real data
const axios = require('axios');

// Configuration - update these values as needed
const API_URL = process.env.API_URL || 'http://localhost:3001';
const CLASSROOM_ID = 1; // Update with a real classroom ID

async function testClassroomPerformance() {
  try {
    console.log(`\n🔍 Testing classroom performance endpoint for classroom ${CLASSROOM_ID}...`);
    
    const response = await axios.get(`${API_URL}/api/classrooms/${CLASSROOM_ID}/performance`);
    const performanceData = response.data;
    
    console.log(`\n✅ Successfully fetched performance data for ${performanceData.length} students\n`);
    
    // Check each student's data
    performanceData.forEach((data, index) => {
      console.log(`\nStudent ${index + 1}: ${data.student.name}`);
      console.log('─'.repeat(40));
      console.log(`Math Mastery: ${(data.performance.mathMastery * 100).toFixed(1)}%`);
      console.log(`Average Score: ${data.performance.averageScore.toFixed(1)}%`);
      console.log(`Questions Answered: ${data.performance.questionsAnswered}`);
      console.log(`Time Spent: ${Math.floor(data.performance.timeSpent / 60)} minutes`);
      console.log(`Last Active: ${data.performance.lastActive ? new Date(data.performance.lastActive).toLocaleString() : 'Never'}`);
      console.log(`Intervention Needed: ${data.intervention.needed ? 'Yes' : 'No'}`);
      if (data.intervention.needed) {
        console.log(`Intervention Priority: ${data.intervention.priority}`);
        console.log(`Reason: ${data.intervention.reason}`);
      }
    });
    
    // Summary statistics
    const avgMastery = performanceData.reduce((sum, d) => sum + d.performance.mathMastery, 0) / performanceData.length;
    const needingIntervention = performanceData.filter(d => d.intervention.needed).length;
    
    console.log('\n' + '═'.repeat(50));
    console.log('SUMMARY:');
    console.log(`Average Class Math Mastery: ${(avgMastery * 100).toFixed(1)}%`);
    console.log(`Students Needing Intervention: ${needingIntervention} out of ${performanceData.length}`);
    
  } catch (error) {
    console.error('\n❌ Error testing classroom performance:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testClassroomPerformance();