// Single API handler for all routes
module.exports = (req, res) => {
  console.log(`API request: ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Route handling
  const { url, method } = req;
  
  // Hello endpoint
  if (url === '/api' || url === '/api/' || url.endsWith('/api/hello')) {
    return res.status(200).json({
      message: 'Hello from Vercel API!',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }
  
  // Login endpoint
  if (url.endsWith('/api/auth/login') && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { email, password } = data;
        
        console.log(`Login attempt for: ${email}`);
        
        if (email === 'admin@example.com' && password === 'admin123') {
          console.log('✅ Login successful');
          return res.status(200).json({
            success: true,
            token: 'vercel-api-token',
            user: { id: 999, auth_id: email },
            role: 'admin',
            message: 'Login successful'
          });
        }
        
        if (email === 'teacher@example.com' && password === 'teacher123') {
          return res.status(200).json({
            success: true,
            token: 'vercel-teacher-token',
            user: { id: 888, auth_id: email },
            role: 'teacher'
          });
        }
        
        if (email === 'student@example.com' && password === 'student123') {
          return res.status(200).json({
            success: true,
            token: 'vercel-student-token',
            user: { id: 777, auth_id: email },
            role: 'student'
          });
        }
        
        if (email === 'parent@example.com' && password === 'parent123') {
          return res.status(200).json({
            success: true,
            token: 'vercel-parent-token',
            user: { id: 666, auth_id: email },
            role: 'parent'
          });
        }
        
        console.log('❌ Invalid credentials');
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Use admin@example.com/admin123, teacher@example.com/teacher123, student@example.com/student123, or parent@example.com/parent123'
        });
      } catch (e) {
        console.error('JSON parse error:', e);
        return res.status(400).json({
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
    path: req.url,
    availableEndpoints: ['/api/hello', '/api/auth/login']
  });
};