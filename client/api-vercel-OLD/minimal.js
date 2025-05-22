// Ultra-minimal serverless function for debugging
console.log('🔄 Loading minimal serverless function...');

const express = require('express');
const app = express();

console.log('✅ Express loaded');

// Basic CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// JSON parser
app.use(express.json());

console.log('✅ Middleware configured');

// Test endpoints
app.get('/api', (req, res) => {
  console.log('📡 Root API endpoint hit');
  res.json({
    status: 'ok',
    message: 'Minimal API is working',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? 'set' : 'hardcoded-fallback'
    }
  });
});

app.get('/api/test', (req, res) => {
  console.log('📡 Test endpoint hit');
  res.json({ message: 'Test successful' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('📡 Login endpoint hit');
  const { email, password } = req.body || {};
  
  if (email === 'admin@example.com' && password === 'admin123') {
    return res.json({
      token: 'test-token',
      user: { id: 999, auth_id: email },
      role: 'admin'
    });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// Catch all
app.use('*', (req, res) => {
  console.log(`📡 Catch-all hit: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    method: req.method
  });
});

console.log('✅ Routes configured');
console.log('🚀 Exporting handler');

module.exports = (req, res) => {
  console.log(`📡 Handler called: ${req.method} ${req.url}`);
  return app(req, res);
};