// This script ensures that pg and other dependencies are properly installed
const { execSync } = require('child_process');

console.log('Starting install script for API dependencies...');

try {
  // Install pg and other critical dependencies explicitly
  console.log('Installing pg and other database dependencies...');
  execSync('npm install pg pg-hstore', { stdio: 'inherit' });
  
  console.log('API dependencies installed successfully');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
}