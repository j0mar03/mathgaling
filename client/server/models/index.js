'use strict';

// Load environment variables from .env file
const path = require('path'); // Moved path require up
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Explicitly set path

const fs = require('fs');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env]; // Changed to require config.js
const db = {};

let sequelize;
if (config.use_env_variable) {
  // Ensure the environment variable is set in production
  if (!process.env[config.use_env_variable]) {
    throw new Error(`Environment variable ${config.use_env_variable} is not set.`);
  }
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Check if development variables are set (optional but good practice)
  if (env === 'development' && (!config.username || !config.database)) {
     console.warn('Development database configuration might be missing in config/config.json or .env file.');
  }
  // Add detailed logging before connection attempt
  console.log(`--- Attempting Sequelize connection (${env}) ---`);
  console.log('Database:', config.database);
  console.log('Username:', config.username);
  console.log('Password:', config.password ? '******' : '(Not Set)'); // Avoid logging password
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('Dialect:', config.dialect);
  // console.log('Full Config Object:', JSON.stringify(config, null, 2)); // Optional: Log full config

  // Ensure password is a string, even if empty (though dotenv should load it)
  sequelize = new Sequelize(config.database, config.username, config.password || '', config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // Pass sequelize instance and DataTypes to the model definition function
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Call associate method if it exists
  }
});

db.sequelize = sequelize; // The Sequelize instance
db.Sequelize = Sequelize; // The Sequelize library

module.exports = db;
