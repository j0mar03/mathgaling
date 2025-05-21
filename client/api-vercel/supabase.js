// Enhanced Supabase client with detailed logging and error handling
const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let initError = null;
let initStatus = 'not_initialized';

// Function to initialize Supabase client with detailed logging
function initSupabase() {
  try {
    console.log('🔄 Initializing Supabase client...');
    
    // Check for environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      console.error('❌ Missing SUPABASE_URL environment variable');
      initError = 'Missing SUPABASE_URL environment variable';
      initStatus = 'missing_url';
      return null;
    }
    
    if (!supabaseKey) {
      console.error('❌ Missing SUPABASE_KEY environment variable');
      initError = 'Missing SUPABASE_KEY environment variable';
      initStatus = 'missing_key';
      return null;
    }
    
    console.log('✅ Supabase credentials found in environment variables');
    
    try {
      // Create Supabase client (this doesn't verify connectivity yet)
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      });
      
      console.log('✅ Supabase client created successfully');
      initStatus = 'initialized';
      
      // Return the client without waiting for connectivity test
      // This allows the API to continue initializing while connectivity is tested
      supabase = client;
      
      // Test connectivity asynchronously
      (async () => {
        try {
          console.log('🔄 Testing Supabase connectivity...');
          // Simple query to check connectivity
          const { data, error } = await client
            .from('admins')
            .select('count')
            .limit(1);
            
          if (error) {
            console.error('❌ Supabase connectivity test failed:', error.message);
            initError = error.message;
            initStatus = 'connectivity_error';
          } else {
            console.log('✅ Supabase connectivity test successful');
            initStatus = 'connected';
            initError = null;
          }
        } catch (testError) {
          console.error('❌ Error during connectivity test:', testError.message);
          initError = testError.message;
          initStatus = 'test_error';
        }
      })();
      
      return client;
    } catch (createError) {
      console.error('❌ Failed to create Supabase client:', createError);
      initError = createError.message;
      initStatus = 'creation_error';
      return null;
    }
  } catch (overallError) {
    console.error('❌ Unexpected error during Supabase initialization:', overallError);
    initError = overallError.message;
    initStatus = 'unexpected_error';
    return null;
  }
}

// Get existing Supabase client or initialize a new one
function getSupabase() {
  if (!supabase) {
    // Only try to initialize once
    if (initStatus === 'not_initialized') {
      supabase = initSupabase();
    } else {
      console.warn(`⚠️ Supabase client requested but initialization previously failed: ${initStatus}`);
    }
  }
  return supabase;
}

// Get initialization status
function getStatus() {
  return {
    status: initStatus,
    error: initError
  };
}

// Export Supabase client functions
module.exports = {
  init: initSupabase,
  get: getSupabase,
  status: getStatus
};