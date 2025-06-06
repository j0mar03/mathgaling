// Enhanced Supabase client with detailed logging and error handling
console.log('🔄 Loading Supabase module...');

// Hardcoded credentials for testing (TEMPORARY)
const FALLBACK_SUPABASE_URL = process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
const FALLBACK_SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';

console.log('🔍 Environment variable check:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let initError = null;
let initStatus = 'not_initialized';

// Function to initialize Supabase client with detailed logging
function initSupabase() {
  try {
    console.log('🔄 Initializing Supabase client...');
    
    // Check for environment variables with fallbacks
    const supabaseUrl = FALLBACK_SUPABASE_URL;
    const supabaseKey = FALLBACK_SUPABASE_KEY;
    
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