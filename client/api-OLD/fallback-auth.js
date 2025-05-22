// Fallback authentication mechanism for Vercel deployment
// This allows basic API testing even if the JWT system has issues

// Predefined test tokens for emergency access
const TEST_TOKENS = {
  'test-admin-token': { id: 999, auth_id: 'admin@example.com', role: 'admin' },
  'test-teacher-token': { id: 888, auth_id: 'teacher@example.com', role: 'teacher' },
  'test-student-token': { id: 777, auth_id: 'student@example.com', role: 'student' },
  'test-parent-token': { id: 666, auth_id: 'parent@example.com', role: 'parent' }
};

// Function to provide fallback authentication
function getFallbackAuth() {
  return {
    // Replacement for the standard token verification
    verifyToken: (req, res, next) => {
      try {
        // First try the real JWT verification if available
        const jwt = require('jsonwebtoken');
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
          return tryFallbackAuth(req, res, next);
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
          return tryFallbackAuth(req, res, next);
        }
        
        try {
          // Try to verify with JWT
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
          req.user = decoded;
          return next();
        } catch (jwtError) {
          console.error('JWT verification failed, trying fallback:', jwtError.message);
          return tryFallbackAuth(req, res, next);
        }
      } catch (error) {
        console.error('JWT module not available, using fallback auth only:', error.message);
        return tryFallbackAuth(req, res, next);
      }
    }
  };
  
  // Internal function to check fallback tokens
  function tryFallbackAuth(req, res, next) {
    // If in production but not in test mode, deny access
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_AUTH !== 'true') {
      console.log('Fallback auth not enabled in production');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      // Check if it's one of our test tokens
      if (TEST_TOKENS[token]) {
        console.log('Using fallback test token for:', TEST_TOKENS[token].role);
        req.user = TEST_TOKENS[token];
        return next();
      }
    }
    
    // Check for test token in query string (for easy testing in browser)
    if (req.query.test_token && TEST_TOKENS[req.query.test_token]) {
      console.log('Using fallback test token from query string for:', TEST_TOKENS[req.query.test_token].role);
      req.user = TEST_TOKENS[req.query.test_token];
      return next();
    }
    
    // No valid token found
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'API available with test tokens in development mode'
    });
  }
}

module.exports = getFallbackAuth;