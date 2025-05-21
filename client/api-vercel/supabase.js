// Initialize Supabase client
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

// Function to initialize Supabase client
function initSupabase() {
  // Check for environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.error('Required: SUPABASE_URL and SUPABASE_KEY (or SUPABASE_ANON_KEY)');
    return null;
  }
  
  try {
    // Create Supabase client
    const client = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    return null;
  }
}

// Get Supabase client (initialize if needed)
function getSupabase() {
  if (!supabase) {
    supabase = initSupabase();
  }
  return supabase;
}

// Export Supabase client functions
module.exports = {
  init: initSupabase,
  get: getSupabase
};