#!/usr/bin/env node

'use strict';

const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

// Import configuration
const config = require('../config/config.js');

// Get environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  }
);

// Create Umzug instance for seeders
const seeder = new Umzug({
  migrations: {
    glob: path.resolve(__dirname, '../seeders/20250515001000-enhanced-knowledge-components.js'),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Function to seed data
async function seedData() {
  try {
    console.log('Starting to seed knowledge component data...');
    
    // Run the seeder
    await seeder.up();
    
    console.log('Knowledge component data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding knowledge component data:', error);
    process.exit(1);
  }
}

// Run the function
seedData(); 