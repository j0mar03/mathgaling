// Lightweight serverless adapter for Vercel
console.log('🔄 Initializing lightweight serverless adapter for Vercel');

// Environment check
console.log('📊 Environment:', process.env.NODE_ENV);
console.log('📂 Working directory:', process.cwd());
console.log('📊 Environment variables check:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

// Preload critical modules
try {
  require('express');
  require('jsonwebtoken');
  require('pg');
  require('@supabase/supabase-js');
  console.log('✅ Critical modules loaded successfully');
} catch (error) {
  console.error('❌ Error loading critical modules:', error.message);
}

// Initialize Supabase
const supabaseClient = require('./supabase');
const supabase = supabaseClient.init();

// Simple Express app for fallback
const express = require('express');
const app = express();

// Middleware
app.use(require('cors')({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// JSON body parser with error handling
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf.toString();
  }
}));

// Catch JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON parsing error:', err.message);
    return res.status(400).json({ 
      error: 'Invalid JSON in request body',
      message: 'The request body contains invalid JSON'
    });
  }
  // Pass error to next middleware
  next(err);
});

// Basic routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    mode: 'lightweight',
    timestamp: new Date().toISOString()
  });
});

// Auth route with Supabase fallback
app.post('/api/auth/login', async (req, res) => {
  try {
    // Log incoming request (without sensitive data)
    console.log('📥 Login request received for user:', req.body?.email || 'unknown');
    
    // Check if body exists
    if (!req.body) {
      console.warn('⚠️ Empty request body in login attempt');
      return res.status(400).json({
        error: 'Missing request body'
      });
    }
    
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      console.warn('⚠️ Missing email or password in login attempt');
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // HYBRID APPROACH: Try Supabase first, fall back to test accounts
    
    // Step 1: Check if we have Supabase connection
    const supabase = supabaseClient.get();
    if (supabase) {
      console.log('🔍 Attempting Supabase authentication...');
      try {
        // Try to authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.warn('⚠️ Supabase authentication error:', error.message);
          // Don't return error yet, try fallback accounts
        } else if (data && data.user) {
          console.log('✅ Supabase login successful for:', email);
          
          // Get user role and ID from Supabase
          let role = 'student'; // Default role
          let userId = data.user.id;
          
          // Query for user profile to get role
          try {
            // First try admin
            const { data: adminData } = await supabase
              .from('admins')
              .select('id, auth_id')
              .eq('auth_id', email)
              .single();
              
            if (adminData) {
              role = 'admin';
              userId = adminData.id;
            } else {
              // Try teacher
              const { data: teacherData } = await supabase
                .from('teachers')
                .select('id, auth_id')
                .eq('auth_id', email)
                .single();
                
              if (teacherData) {
                role = 'teacher';
                userId = teacherData.id;
              } else {
                // Try student
                const { data: studentData } = await supabase
                  .from('students')
                  .select('id, auth_id')
                  .eq('auth_id', email)
                  .single();
                  
                if (studentData) {
                  role = 'student';
                  userId = studentData.id;
                } else {
                  // Try parent
                  const { data: parentData } = await supabase
                    .from('parents')
                    .select('id, auth_id')
                    .eq('auth_id', email)
                    .single();
                    
                  if (parentData) {
                    role = 'parent';
                    userId = parentData.id;
                  }
                }
              }
            }
          } catch (profileError) {
            console.warn('⚠️ Error fetching user profile:', profileError.message);
            // Continue with default role
          }
          
          // Create JWT token
          const jwt = require('jsonwebtoken');
          const token = jwt.sign(
            { id: userId, auth_id: email, role },
            process.env.JWT_SECRET || 'itsKidsSecureTokenDevKey2025NobodyWillGuessThis!',
            { expiresIn: '7d' }
          );
          
          return res.status(200).json({
            token,
            user: { id: userId, auth_id: email },
            role
          });
        }
      } catch (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        // Continue to fallback accounts
      }
    }
    
    // Step 2: Fallback to test accounts if Supabase failed
    console.log('🔄 Using fallback test accounts...');
    
    // Use JWT to create real tokens for test accounts
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'itsKidsSecureTokenDevKey2025NobodyWillGuessThis!';
    
    // Test user credentials
    if (email === 'admin@example.com' && password === 'admin123') {
      const token = jwt.sign(
        { id: 999, auth_id: email, role: 'admin' },
        jwtSecret,
        { expiresIn: '7d' }
      );
      
      console.log('✅ Admin login successful (fallback)');
      return res.status(200).json({
        token,
        user: { id: 999, auth_id: email },
        role: 'admin'
      });
    }
    
    if (email === 'teacher@example.com' && password === 'teacher123') {
      const token = jwt.sign(
        { id: 888, auth_id: email, role: 'teacher' },
        jwtSecret,
        { expiresIn: '7d' }
      );
      
      console.log('✅ Teacher login successful (fallback)');
      return res.status(200).json({
        token,
        user: { id: 888, auth_id: email },
        role: 'teacher'
      });
    }
    
    if (email === 'student@example.com' && password === 'student123') {
      const token = jwt.sign(
        { id: 777, auth_id: email, role: 'student' },
        jwtSecret,
        { expiresIn: '7d' }
      );
      
      console.log('✅ Student login successful (fallback)');
      return res.status(200).json({
        token,
        user: { id: 777, auth_id: email },
        role: 'student'
      });
    }
    
    if (email === 'parent@example.com' && password === 'parent123') {
      const token = jwt.sign(
        { id: 666, auth_id: email, role: 'parent' },
        jwtSecret,
        { expiresIn: '7d' }
      );
      
      console.log('✅ Parent login successful (fallback)');
      return res.status(200).json({
        token,
        user: { id: 666, auth_id: email },
        role: 'parent'
      });
    }
    
    // No successful login from either method
    console.warn('❌ Invalid credentials for:', email);
    return res.status(401).json({
      error: 'Invalid credentials. Please use demo accounts: admin@example.com/admin123, teacher@example.com/teacher123, student@example.com/student123, or parent@example.com/parent123'
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      error: 'Server error during login',
      message: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Routes for various user types to return minimal data
app.get('/api/teachers/:id/classrooms', (req, res) => {
  return res.json([
    { id: 1, name: 'Grade 3A', description: 'Mock classroom for Vercel deployment' },
    { id: 2, name: 'Grade 4B', description: 'Mock classroom for Vercel deployment' }
  ]);
});

app.get('/api/parents/:id/students', (req, res) => {
  return res.json([
    { id: 101, name: 'Mock Child 1', grade: 3 },
    { id: 102, name: 'Mock Child 2', grade: 4 }
  ]);
});

app.get('/api/students/:id/progress', (req, res) => {
  return res.json({
    overall_mastery: 0.75,
    recent_activities: []
  });
});

// Redirect to main app
app.get('/api', (req, res) => {
  res.redirect('/');
});

// Debug endpoint with database connection status
app.get('/api/debug', async (req, res) => {
  try {
    // Check Supabase connection
    const supabase = supabaseClient.get();
    let supabaseStatus = 'not_initialized';
    let databaseStatus = 'unknown';
    
    if (supabase) {
      try {
        // Basic query to test connection
        const { data, error } = await supabase
          .from('admins')
          .select('count')
          .limit(1);
          
        supabaseStatus = error ? 'error' : 'connected';
        databaseStatus = error ? 'error' : 'connected';
      } catch (supabaseError) {
        supabaseStatus = 'error';
        databaseStatus = 'error';
      }
    }
    
    // Check environment variables (mask sensitive parts)
    const envVars = {};
    
    // Check DB connection string
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      // Mask password in connection string
      const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:****@');
      envVars.DATABASE_URL = maskedUrl;
    }
    
    // Check Supabase credentials
    if (process.env.SUPABASE_URL) {
      envVars.SUPABASE_URL = process.env.SUPABASE_URL;
    }
    
    if (process.env.SUPABASE_KEY) {
      envVars.SUPABASE_KEY = process.env.SUPABASE_KEY.substring(0, 5) + '...' + process.env.SUPABASE_KEY.slice(-5);
    }
    
    // Check JWT secret
    if (process.env.JWT_SECRET) {
      envVars.JWT_SECRET = process.env.JWT_SECRET ? '******** (set)' : 'not set';
    }
    
    // Return debug information
    res.json({
      status: 'ok',
      message: 'Lightweight API for Vercel deployment',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: {
        supabase_status: supabaseStatus,
        database_status: databaseStatus
      },
      environment_variables: envVars,
      test_accounts: [
        'admin@example.com / admin123',
        'teacher@example.com / teacher123',
        'student@example.com / student123',
        'parent@example.com / parent123'
      ],
      note: 'This is a hybrid API that tries to connect to Supabase and falls back to test accounts if needed.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error generating debug information',
      error: error.message
    });
  }
});

// Fallback route with CORS headers
app.use('/api/*', (req, res) => {
  res.status(503).json({
    status: 'service_unavailable',
    message: 'This API endpoint is temporarily unavailable in the Vercel deployment',
    error: 'Vercel serverless function size limit exceeded',
    recommendation: 'Please use the test accounts: admin@example.com/admin123, teacher@example.com/teacher123, student@example.com/student123, or parent@example.com/parent123',
    timestamp: new Date().toISOString()
  });
});

// Add error handler middleware
app.use((err, req, res, next) => {
  console.error('❌ Global error handler caught:', err);
  // Send a proper error response
  res.status(500).json({
    error: 'Server error',
    message: err.message || 'Unknown error occurred',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export the serverless handler with error trapping
module.exports = (req, res) => {
  // Generate a unique request ID for tracking
  const reqId = Math.random().toString(36).substring(2, 15);
  
  // Log request details
  console.log(`📡 Request ${reqId}: ${req.method} ${req.url}`);
  
  // Add request ID to req object for logging
  req.id = reqId;
  
  // Add response logger
  const originalEnd = res.end;
  res.end = function() {
    console.log(`📤 Response ${reqId}: ${res.statusCode} ${res.statusMessage || ''}`);
    return originalEnd.apply(this, arguments);
  };
  
  // Try/catch for any synchronous errors in the handler
  try {
    return app(req, res);
  } catch (error) {
    console.error(`❌ Unhandled error in request ${reqId}:`, error);
    res.status(500).json({
      error: 'Unhandled server error',
      message: 'The server encountered an unexpected error processing your request',
      requestId: reqId,
      timestamp: new Date().toISOString()
    });
  }
};