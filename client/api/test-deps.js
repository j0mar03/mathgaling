#!/usr/bin/env node

/**
 * Simple script to test if dependencies are available
 * Run with: node test-deps.js
 */

console.log('🔄 Testing dependency availability...');

// Modules to test
const modulesToTest = [
  'jsonwebtoken',
  'pg',
  'pg-hstore',
  'bcrypt',
  'sequelize',
  'express',
  'cors',
  'dotenv',
  'multer'
];

// Test each module
const results = [];

for (const moduleName of modulesToTest) {
  try {
    const module = require(moduleName);
    results.push({
      module: moduleName,
      available: true,
      path: require.resolve(moduleName),
      version: module.version || 'unknown'
    });
    console.log(`✅ ${moduleName}: Available at ${require.resolve(moduleName)}`);
  } catch (error) {
    results.push({
      module: moduleName,
      available: false,
      error: error.message
    });
    console.error(`❌ ${moduleName}: Not available - ${error.message}`);
  }
}

// Print summary
const availableCount = results.filter(r => r.available).length;
const unavailableCount = results.length - availableCount;

console.log(`\n📊 Summary: ${availableCount}/${results.length} modules available`);

if (unavailableCount > 0) {
  console.log('\n❌ Missing modules:');
  results.filter(r => !r.available).forEach(r => {
    console.log(`- ${r.module}: ${r.error}`);
  });
  
  // Exit with error code if any modules are missing
  process.exit(1);
} else {
  console.log('\n✅ All modules available!');
  process.exit(0);
}