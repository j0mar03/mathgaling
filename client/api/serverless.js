// Serverless adapter for Vercel
// Explicitly import pg to ensure it's available for Sequelize
try {
  require('pg');
  console.log('PostgreSQL driver loaded successfully');
} catch (error) {
  console.error('Error loading PostgreSQL driver:', error);
}

const app = require('./index');

module.exports = (req, res) => {
  // This converts the Vercel serverless request to an Express request
  // Note: In Vercel, each serverless function handles one request at a time
  return app(req, res);
};