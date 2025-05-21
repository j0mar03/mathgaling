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
app.use(express.json());

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
    const { email, password } = req.body;
    console.log(`📧 Login attempt for: ${email}`);
    
    // Test user credentials
    if (email === 'admin@example.com' && password === 'admin123') {
      return res.json({
        token: 'mock-admin-token',
        user: { id: 999, auth_id: email },
        role: 'admin'
      });
    }
    
    if (email === 'teacher@example.com' && password === 'teacher123') {
      return res.json({
        token: 'mock-teacher-token',
        user: { id: 888, auth_id: email },
        role: 'teacher'
      });
    }
    
    if (email === 'student@example.com' && password === 'student123') {
      return res.json({
        token: 'mock-student-token',
        user: { id: 777, auth_id: email },
        role: 'student'
      });
    }
    
    if (email === 'parent@example.com' && password === 'parent123') {
      return res.json({
        token: 'mock-parent-token',
        user: { id: 666, auth_id: email },
        role: 'parent'
      });
    }
    
    // Default case - failed login
    return res.status(401).json({
      error: 'Invalid credentials'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Server error during login',
      message: error.message
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

// Export the serverless handler
module.exports = (req, res) => {
  console.log(`📡 Request: ${req.method} ${req.url}`);
  return app(req, res);
};