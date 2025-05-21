// Script to check environment variables and database connection
const { Sequelize } = require('sequelize');

console.log('=== Checking Environment Variables ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (Value hidden)' : 'Not set');

// Test database connection
async function testDbConnection() {
  console.log('\n=== Testing Database Connection ===');
  let sequelize;
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL environment variable is not set.');
      return;
    }
    
    console.log('Attempting to connect to database...');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Required for some Postgres providers
        }
      },
      logging: console.log
    });
    
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // List all tables to further validate connection
    const [results] = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('\nDatabase tables:');
    results.forEach(row => console.log(`- ${row.table_name}`));
    
  } catch (error) {
    console.error('ERROR: Database connection failed:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed.');
    }
  }
}

testDbConnection();