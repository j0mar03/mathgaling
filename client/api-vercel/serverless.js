// Lightweight serverless adapter for Vercel
console.log('🔄 Initializing lightweight serverless adapter for Vercel');

// Environment check
console.log('📊 Environment:', process.env.NODE_ENV);
console.log('📂 Working directory:', process.cwd());

// Preload critical modules
try {
  require('express');
  require('jsonwebtoken');
  require('pg');
  console.log('✅ Critical modules loaded successfully');
} catch (error) {
  console.error('❌ Error loading critical modules:', error.message);
}

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

// Mock auth route for testing
app.post('/api/auth/login', (req, res) => {
  try {
    // Log incoming request
    console.log('📥 Login request received with body:', JSON.stringify(req.body || {}));
    
    // Check if body exists
    if (!req.body) {
      console.warn('⚠️ Empty request body in login attempt');
      return res.status(400).json({
        error: 'Missing request body'
      });
    }
    
    const { email, password } = req.body;
    
    // Log attempt
    console.log(`📧 Login attempt for: ${email || 'unknown email'}`);
    
    // Validate required fields
    if (!email || !password) {
      console.warn('⚠️ Missing email or password in login attempt');
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    
    // Test user credentials with proper JWT token format
    if (email === 'admin@example.com' && password === 'admin123') {
      // Create a simple JWT-like token (not real JWT, just for simulation)
      const payload = JSON.stringify({ id: 999, auth_id: email, role: 'admin' });
      const base64Payload = Buffer.from(payload).toString('base64');
      const mockToken = `header.${base64Payload}.signature`;
      
      console.log('✅ Admin login successful');
      return res.status(200).json({
        token: mockToken,
        user: { id: 999, auth_id: email },
        role: 'admin'
      });
    }
    
    if (email === 'teacher@example.com' && password === 'teacher123') {
      const payload = JSON.stringify({ id: 888, auth_id: email, role: 'teacher' });
      const base64Payload = Buffer.from(payload).toString('base64');
      const mockToken = `header.${base64Payload}.signature`;
      
      console.log('✅ Teacher login successful');
      return res.status(200).json({
        token: mockToken,
        user: { id: 888, auth_id: email },
        role: 'teacher'
      });
    }
    
    if (email === 'student@example.com' && password === 'student123') {
      const payload = JSON.stringify({ id: 777, auth_id: email, role: 'student' });
      const base64Payload = Buffer.from(payload).toString('base64');
      const mockToken = `header.${base64Payload}.signature`;
      
      console.log('✅ Student login successful');
      return res.status(200).json({
        token: mockToken,
        user: { id: 777, auth_id: email },
        role: 'student'
      });
    }
    
    if (email === 'parent@example.com' && password === 'parent123') {
      const payload = JSON.stringify({ id: 666, auth_id: email, role: 'parent' });
      const base64Payload = Buffer.from(payload).toString('base64');
      const mockToken = `header.${base64Payload}.signature`;
      
      console.log('✅ Parent login successful');
      return res.status(200).json({
        token: mockToken,
        user: { id: 666, auth_id: email },
        role: 'parent'
      });
    }
    
    // Default case - failed login
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

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Lightweight API for Vercel deployment',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    note: 'This is a limited version of the API for Vercel deployment. For full functionality, deploy to a traditional hosting platform.'
  });
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