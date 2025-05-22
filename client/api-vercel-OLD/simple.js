// Ultra-simple serverless function - no external dependencies
console.log('🚀 Simple serverless function starting...');

module.exports = (req, res) => {
  console.log(`📡 ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Simple routing
  if (req.url === '/api' || req.url === '/api/') {
    res.status(200).json({
      status: 'ok',
      message: 'Simple API is working!',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (req.url === '/api/test') {
    res.status(200).json({
      message: 'Test endpoint working',
      method: req.method,
      url: req.url
    });
    return;
  }
  
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    // Parse body manually
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { email, password } = data;
        
        if (email === 'admin@example.com' && password === 'admin123') {
          res.status(200).json({
            success: true,
            token: 'simple-test-token',
            user: { id: 999, email },
            role: 'admin'
          });
        } else {
          res.status(401).json({
            error: 'Invalid credentials',
            message: 'Use admin@example.com / admin123'
          });
        }
      } catch (e) {
        res.status(400).json({
          error: 'Invalid JSON',
          message: e.message
        });
      }
    });
    return;
  }
  
  // Default 404
  res.status(404).json({
    error: 'Not found',
    path: req.url
  });
};

console.log('✅ Simple serverless function exported');