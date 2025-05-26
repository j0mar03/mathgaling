const axios = require('axios');

// Test the problematic API endpoints directly
const studentId = 21; // The failing student ID from the error report
const baseURL = 'https://mathgaling.netlify.app'; // Replace with your actual deployed URL

const testEndpoints = async () => {
  console.log(`🔍 Testing API endpoints for student ID: ${studentId}\n`);
  
  const endpoints = [
    ['Student Profile', `/api/students/${studentId}`],
    ['Knowledge States', `/api/students/${studentId}/knowledge-states`],
    ['Learning Path', `/api/students/${studentId}/learning-path`],
    ['Weekly Report', `/api/parents/students/${studentId}/weekly-report`],
    ['Detailed Performance', `/api/students/${studentId}/detailed-performance`]
  ];
  
  for (const [name, path] of endpoints) {
    console.log(`\n📊 Testing: ${name}`);
    console.log(`🔗 URL: ${baseURL}${path}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${baseURL}${path}`, {
        timeout: 10000 // 10 second timeout
      });
      const endTime = Date.now();
      
      console.log(`✅ SUCCESS (${endTime - startTime}ms)`);
      console.log(`📈 Status: ${response.status}`);
      console.log(`📦 Data type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
      
      if (Array.isArray(response.data)) {
        console.log(`📊 Array length: ${response.data.length}`);
      }
      
      // Show a small sample of the data
      if (response.data && typeof response.data === 'object') {
        const keys = Object.keys(response.data).slice(0, 5);
        console.log(`🔑 Data keys (first 5): ${keys.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ FAILED`);
      console.log(`💥 Error: ${error.message}`);
      console.log(`📈 Status: ${error.response?.status || 'N/A'}`);
      console.log(`📝 Status Text: ${error.response?.statusText || 'N/A'}`);
      
      if (error.response?.data) {
        console.log(`📋 Error Data:`, JSON.stringify(error.response.data, null, 2));
      }
      
      // This is likely the failing endpoint - let's investigate further
      if (error.response?.status === 500) {
        console.log(`\n🚨 CRITICAL: This endpoint is returning 500 error!`);
        console.log(`🔍 This is likely the source of the ChildProgressView failure.`);
      }
    }
  }
  
  console.log(`\n🏁 API endpoint testing completed.`);
};

// Run the test
testEndpoints().catch(console.error);