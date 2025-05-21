// Setup script for messaging functionality
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Setting up messaging system...');

// Check if the database exists
try {
  console.log('Checking database connection...');
  execSync('npx sequelize-cli db:migrate:status', { stdio: 'inherit' });
  console.log('Database connection successful!');
} catch (error) {
  console.error('Database connection failed. Make sure your database is running.');
  process.exit(1);
}

// Run migrations
try {
  console.log('\nRunning migrations for messages and notifications tables...');
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  console.log('Migrations completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

// Run seeders
try {
  console.log('\nSeeding demo messages and notifications...');
  execSync('npx sequelize-cli db:seed --seed 20250515000001-demo-messages.js 20250515000002-demo-notifications.js', { stdio: 'inherit' });
  console.log('Seeders completed successfully!');
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exit(1);
}

console.log('\nSetup completed successfully!');
console.log('Messaging system is now ready to use.');
console.log('You can now use the "Contact Student" feature in the teacher dashboard.'); 