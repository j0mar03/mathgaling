// Database configuration helper for handling environment differences
const { createClient } = require('@supabase/supabase-js');

class DatabaseConfig {
  constructor() {
    // Determine environment
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isSupabase = !!(process.env.SUPABASE_URL || process.env.DATABASE_URL);
    
    // Supabase configuration
    this.supabaseUrl = process.env.DATABASE_URL || 
                       process.env.SUPABASE_URL || 
                       'https://aiablmdmxtssbcvtpudw.supabase.co';
    
    this.supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || 
                       process.env.SUPABASE_ANON_KEY || 
                       process.env.SUPABASE_KEY || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
    
    // Initialize Supabase client
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }
  
  // Helper method to handle user creation with auto-increment issues
  async createUser(tableName, userData) {
    console.log(`Creating user in ${tableName}:`, userData);
    
    // First check if user already exists
    const { data: existing } = await this.supabase
      .from(tableName)
      .select('*')
      .eq('auth_id', userData.auth_id)
      .single();
      
    if (existing) {
      console.log('User already exists:', existing);
      return { data: existing, error: null };
    }
    
    // Try to insert without ID
    let { data, error } = await this.supabase
      .from(tableName)
      .insert([userData])
      .select();
    
    // Handle duplicate key error by calculating next ID
    if (error && error.code === '23505') {
      console.log('Handling duplicate key error, calculating next ID...');
      
      const { data: maxIdData } = await this.supabase
        .from(tableName)
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      
      const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
      console.log(`Next ID for ${tableName}: ${nextId}`);
      
      // Retry with explicit ID
      const result = await this.supabase
        .from(tableName)
        .insert([{ ...userData, id: nextId }])
        .select();
        
      data = result.data;
      error = result.error;
    }
    
    return { 
      data: data && data.length > 0 ? data[0] : null, 
      error 
    };
  }
  
  // Helper to get table name based on role
  getTableName(role) {
    return role === 'admin' ? 'Admins' : `${role}s`;
  }
  
  // Helper to handle authentication
  async authenticateUser(email, password) {
    // Try Supabase Auth first
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!authError && authData?.user) {
        return { 
          success: true, 
          source: 'supabase_auth', 
          user: authData.user 
        };
      }
    } catch (e) {
      console.warn('Supabase Auth failed:', e.message);
    }
    
    // Fallback to database check (for users created outside of Supabase Auth)
    // Note: In production, you should properly hash and compare passwords
    const tables = ['Admins', 'teachers', 'students', 'parents'];
    
    for (const table of tables) {
      const { data } = await this.supabase
        .from(table)
        .select('*')
        .eq('auth_id', email)
        .single();
        
      if (data) {
        // In production, verify password hash here
        const role = table === 'Admins' ? 'admin' : table.slice(0, -1);
        return {
          success: true,
          source: 'database',
          user: data,
          role: role
        };
      }
    }
    
    return { success: false };
  }
}

module.exports = DatabaseConfig;