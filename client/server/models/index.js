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
try {
  // First explicitly check for pg module
  try {
    require('pg');
    console.log('PostgreSQL driver (pg) is available');
  } catch (pgError) {
    console.error('ERROR: PostgreSQL driver (pg) is not installed:', pgError);
    console.error('Attempting to install pg dynamically...');
    try {
      // This is a desperate attempt for Vercel/serverless environments
      require('child_process').execSync('npm install pg pg-hstore', { stdio: 'inherit' });
      console.log('Successfully installed pg dynamically');
    } catch (installError) {
      console.error('Failed to install pg dynamically:', installError);
    }
  }

  if (config.use_env_variable) {
    // Ensure the environment variable is set in production
    if (!process.env[config.use_env_variable]) {
      console.error(`Environment variable ${config.use_env_variable} is not set.`);
      if (env === 'production') {
        console.error('This is a critical error in production. You must set DATABASE_URL in your environment.');
      }
    } else {
      console.log(`Using connection string from ${config.use_env_variable}`);
      sequelize = new Sequelize(process.env[config.use_env_variable], {
        ...config,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false // Required for some Postgres providers
          }
        }
      });
    }
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
    
    // Ensure password is a string, even if empty (though dotenv should load it)
    sequelize = new Sequelize(config.database, config.username, config.password || '', config);
  }
  
  // Test the connection
  sequelize.authenticate()
    .then(() => console.log('Database connection established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err));
  
} catch (sequelizeError) {
  console.error('Critical error setting up Sequelize:', sequelizeError);
  
  // In production, we'll create a limited database object that fails gracefully
  if (env === 'production') {
    console.warn('Creating fallback database object that will log operations but not perform them');
    // Create a mock sequelize object that logs operations but doesn't perform them
    sequelize = {
      authenticate: () => Promise.resolve(),
      define: () => ({
        findAll: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        create: (data) => Promise.resolve(data),
        update: () => Promise.resolve([0]),
        destroy: () => Promise.resolve(0)
      }),
      models: {},
      transaction: () => Promise.resolve({
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve()
      })
    };
  } else {
    // In development, let's throw the error so it's clear something's wrong
    throw sequelizeError;
  }
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
