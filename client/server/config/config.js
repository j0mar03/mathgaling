// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Explicitly set path

// Add logging to verify environment variables
console.log('--- Sequelize Config ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DEV_DB_USERNAME:', process.env.DEV_DB_USERNAME);
console.log('DEV_DB_PASSWORD:', process.env.DEV_DB_PASSWORD ? '******' : '(Not Set)'); // Don't log password directly
console.log('DEV_DB_NAME:', process.env.DEV_DB_NAME);
console.log('DEV_DB_HOST:', process.env.DEV_DB_HOST);
console.log('DEV_DB_PORT:', process.env.DEV_DB_PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '******' : '(Not Set)');
console.log('------------------------');
module.exports = {
  development: {
    username: process.env.DEV_DB_USERNAME,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    host: process.env.DEV_DB_HOST,
    port: parseInt(process.env.DEV_DB_PORT, 10) || 5432, // Ensure port is an integer
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 60000
    }
  },
  test: {
    username: process.env.DEV_DB_USERNAME,
    password: process.env.DEV_DB_PASSWORD,
    database: `${process.env.DEV_DB_NAME}_test`, // Append _test for test DB
    host: process.env.DEV_DB_HOST,
    port: parseInt(process.env.DEV_DB_PORT, 10) || 5432,
    dialect: 'postgres'
  },
  production: {
    use_env_variable: 'DATABASE_URL', // Keep using DATABASE_URL for production
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Adjust as needed for your production SSL setup
      }
    }
  }
};