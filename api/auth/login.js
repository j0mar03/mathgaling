// Vercel standard login API function
export default function handler(req, res) {
  console.log(`Login request: ${req.method}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    
    if (email === 'admin@example.com' && password === 'admin123') {
      console.log('✅ Login successful');
      return res.status(200).json({
        success: true,
        token: 'vercel-test-token',
        user: { id: 999, auth_id: email },
        role: 'admin',
        message: 'Login successful with Vercel standard API'
      });
    }
    
    console.log('❌ Invalid credentials');
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Use admin@example.com / admin123 for testing'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}