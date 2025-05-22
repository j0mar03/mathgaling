// Lightweight serverless adapter for Vercel
console.log('🔄 Initializing lightweight serverless adapter for Vercel');

// Load required dependencies first
console.log('📦 Loading dependencies...');
const express = require('express');
console.log('✅ Express loaded');

const jwt = require('jsonwebtoken');
console.log('✅ JWT loaded');

// Create Express app immediately
const app = express();
console.log('✅ Express app created');

// Set initialization flag (default to false)
global.apiInitialized = false;

// Environment check
console.log('📊 Environment:', process.env.NODE_ENV);
console.log('📂 Working directory:', process.cwd());
console.log('📊 Environment variables check:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

// Express app already created above

// CORS middleware (basic)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic JSON parsing (with error handling)
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    try {
      // Store raw body for debugging
      req.rawBody = buf.toString();
    } catch (e) {
      // Ignore errors
    }
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
  next(err);
});

// CRITICAL: Debug endpoint that works even if initialization fails
app.get('/api/debug', async (req, res) => {
  try {
    console.log('📊 Debug endpoint accessed');
    
    // Environment information (always available)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? 'set' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing'
    };
    
    // Get Supabase status (wrapped in try/catch)
    let supabaseStatus = 'not_initialized';
    let databaseStatus = 'unknown';
    let initError = null;
    
    try {
      // Get Supabase client and status
      const supabaseClient = require('./supabase');
      const supabase = supabaseClient.get();
      const supabaseClientStatus = supabaseClient.status();
      
      // Use status from the status function
      supabaseStatus = supabaseClientStatus.status;
      databaseStatus = supabaseClientStatus.status === 'connected' ? 'connected' : 'error';
      initError = supabaseClientStatus.error;
      
      // If we have a client, add real-time connectivity check
      if (supabase) {
        // Try a basic query (only if we haven't confirmed connectivity yet)
        if (supabaseStatus !== 'connected') {
          try {
            const { data, error } = await supabase
              .from('admins')
              .select('count')
              .limit(1);
              
            if (error) {
              console.warn('⚠️ Admin table query failed in debug endpoint:', error.message);
              // Try another table to be sure
              const { data: altData, error: altError } = await supabase
                .from('teachers')
                .select('count')
                .limit(1);
                
              if (altError) {
                supabaseStatus = 'error';
                databaseStatus = 'error';
                initError = error.message;
              } else {
                supabaseStatus = 'connected';
                databaseStatus = 'connected';
              }
            } else {
              supabaseStatus = 'connected';
              databaseStatus = 'connected';
            }
          } catch (queryError) {
            console.error('❌ Supabase query error in debug endpoint:', queryError.message);
            supabaseStatus = 'query_error';
            databaseStatus = 'error';
            initError = queryError.message;
          }
        }
      }
    } catch (supabaseError) {
      console.error('❌ Supabase module error in debug endpoint:', supabaseError);
      supabaseStatus = 'module_error';
      initError = supabaseError.message;
    }
    
    // Return comprehensive debug information
    return res.json({
      status: 'debugging',
      api_status: global.apiInitialized ? 'initialized' : 'failed',
      timestamp: new Date().toISOString(),
      environment: envInfo,
      database: {
        supabase_status: supabaseStatus,
        database_status: databaseStatus,
        error: initError
      },
      test_accounts: [
        'admin@example.com / admin123',
        'teacher@example.com / teacher123',
        'student@example.com / student123',
        'parent@example.com / parent123'
      ],
      note: 'This API will fall back to test accounts if Supabase connection fails.'
    });
  } catch (error) {
    // Absolute last resort error handler
    return res.status(500).json({
      status: 'error',
      message: 'Debug endpoint error',
      error: error.message,
      time: new Date().toISOString()
    });
  }
});

// Health check endpoint (always available)
app.get('/api/health', (req, res) => {
  res.json({
    status: global.apiInitialized ? 'healthy' : 'degraded',
    mode: 'lightweight',
    timestamp: new Date().toISOString()
  });
});

// Initialize Supabase (wrapped in try/catch)
let supabase = null;
try {
  const supabaseClient = require('./supabase');
  supabase = supabaseClient.init();
  
  if (!supabase) {
    console.warn('⚠️ Supabase initialization failed, continuing with limited functionality');
  } else {
    console.log('✅ Supabase initialized successfully');
  }
} catch (error) {
  console.error('❌ Supabase initialization error:', error);
}

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
          
          // Create JWT token (load JWT when needed)
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
    
    // Use JWT to create real tokens for test accounts (already loaded)
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

// Simple status endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Lightweight API is running',
    initialized: global.apiInitialized,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// Fallback route with CORS headers
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'not_found',
    message: 'Endpoint not available in lightweight API',
    error: 'Endpoint not implemented',
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

// Mark API as initialized
global.apiInitialized = true;
} catch (initError) {
  console.error('❌ CRITICAL: Serverless initialization failed:', initError);
  global.apiInitialized = false;
  
  // Add error route to existing app
  app.use('*', (req, res) => {
    res.status(500).json({
      error: 'API initialization failed',
      message: 'The API server encountered an error during startup. Please try again later.',
      details: initError.message,
      stack: process.env.NODE_ENV === 'development' ? initError.stack : undefined,
      timestamp: new Date().toISOString()
    });
  });
}

console.log('🚀 Exporting serverless handler');

// Export the serverless handler (always export, regardless of initialization status)
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
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Unhandled server error',
        message: 'The server encountered an unexpected error processing your request',
        requestId: reqId,
        timestamp: new Date().toISOString()
      });
    }
  }
};