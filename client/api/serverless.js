// Serverless adapter for Vercel
console.log('🔄 Initializing serverless.js adapter for Vercel');

// Environment check
console.log('📊 Environment:', process.env.NODE_ENV);
console.log('📂 Working directory:', process.cwd());
console.log('🔍 Files in current directory:', require('fs').readdirSync('.'));

// Preload all critical modules to ensure they're available
const criticalModules = [
  'pg',
  'pg-hstore',
  'jsonwebtoken',
  'bcrypt',
  'sequelize',
  'express',
  'cors',
  'dotenv',
  'multer',
  'csv-parser',
  'csv-writer'
];

// Define module paths to check for additional debugging
const modulePaths = [
  './node_modules/jsonwebtoken',
  '../node_modules/jsonwebtoken',
  '../../node_modules/jsonwebtoken',
  '/var/task/node_modules/jsonwebtoken'
];

// Check module paths
console.log('🔍 Checking for jsonwebtoken module in expected paths...');
modulePaths.forEach(path => {
  try {
    require('fs').accessSync(path);
    console.log(`✅ Path exists: ${path}`);
  } catch (error) {
    console.log(`❌ Path not found: ${path}`);
  }
});

// Create a map to store all loaded modules
const loadedModules = {};

// Load each module and report status
console.log('⏳ Loading critical modules...');
const loadResults = criticalModules.map(moduleName => {
  try {
    loadedModules[moduleName] = require(moduleName);
    console.log(`✅ ${moduleName} loaded successfully`);
    return { module: moduleName, success: true };
  } catch (error) {
    console.error(`❌ Error loading ${moduleName}:`, error.message);
    
    // Attempt to install missing modules on-the-fly (emergency fallback)
    try {
      console.log(`Attempting to install ${moduleName}...`);
      require('child_process').execSync(`npm install ${moduleName} --no-save`, { stdio: 'inherit' });
      console.log(`Installed ${moduleName} successfully`);
      
      // Try loading again
      loadedModules[moduleName] = require(moduleName);
      console.log(`✅ ${moduleName} now loaded successfully after install`);
      return { module: moduleName, success: true, reinstalled: true };
    } catch (installError) {
      console.error(`Failed to install ${moduleName}:`, installError.message);
      return { module: moduleName, success: false, error: error.message };
    }
  }
});

// Log module loading summary
const successfulLoads = loadResults.filter(result => result.success).length;
const failedLoads = loadResults.filter(result => !result.success).length;
console.log(`📊 Module loading summary: ${successfulLoads} successful, ${failedLoads} failed`);

// Provide global access to loaded modules to ensure they're available
if (loadedModules.jsonwebtoken) {
  // Make JWT available globally as a fallback
  global.jsonwebtoken = loadedModules.jsonwebtoken;
  console.log('✅ JWT module cached globally for emergency access');
}

// Load the application with error handling
let app;
try {
  app = require('./index');
  console.log('✅ API loaded successfully');
} catch (error) {
  console.error('❌ Error loading API:', error);
  
  // Create an emergency fallback Express app
  const express = loadedModules.express || require('express');
  app = express();
  
  // Add basic routes for health check and error status
  app.get('/api/health', (req, res) => {
    res.status(503).json({
      status: 'degraded',
      error: 'API failed to initialize properly',
      timestamp: new Date().toISOString()
    });
  });
  
  app.use((req, res) => {
    res.status(500).json({
      error: 'API initialization failed',
      message: 'The API server encountered an error during startup. Please try again later.'
    });
  });
}

// Export the serverless handler
module.exports = (req, res) => {
  // Add request timestamp and ID for debugging
  req.requestTime = new Date();
  req.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // Log request for debugging
  console.log(`📡 Request ${req.requestId}: ${req.method} ${req.url}`);
  
  // This converts the Vercel serverless request to an Express request
  return app(req, res);
};