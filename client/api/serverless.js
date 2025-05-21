// Serverless adapter for Vercel
const app = require('./index');

module.exports = (req, res) => {
  // This converts the Vercel serverless request to an Express request
  // Note: In Vercel, each serverless function handles one request at a time
  return app(req, res);
};