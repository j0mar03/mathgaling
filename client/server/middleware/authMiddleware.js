'use strict';

// Try to load JWT, fall back to alternative if not available
let jwt;
let fallbackAuth;
try {
  jwt = require('jsonwebtoken');
  console.log('✅ JWT module loaded successfully');
} catch (error) {
  console.error('❌ Error loading jsonwebtoken:', error.message);
  console.warn('⚠️ Using fallback authentication mechanism');
  try {
    fallbackAuth = require('../../api/fallback-auth.js');
    console.log('✅ Fallback auth loaded successfully');
  } catch (fallbackError) {
    console.error('❌ Error loading fallback auth:', fallbackError.message);
  }
}

// TODO: Move JWT secret to environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';

// Create middleware functions that match what's imported in index.js

// Function to verify JWT token
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    let decoded;
    
    // Try to use JWT if available, otherwise use fallback
    if (jwt) {
      decoded = jwt.verify(token, JWT_SECRET);
    } else if (fallbackAuth) {
      // If we have the fallback auth module, use it
      return fallbackAuth().verifyToken(req, res, next);
    } else {
      // Last resort emergency fallback
      // This should only run in development/testing environments
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_AUTH !== 'true') {
        throw new Error('JWT module not available and fallback auth not enabled in production');
      }
      
      console.warn('⚠️ Using EMERGENCY authentication bypass - FOR TESTING ONLY');
      // Extract payload from middle part of JWT (UNSAFE, only for testing)
      try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
        decoded = payload;
      } catch (parseError) {
        throw new Error('Invalid token format for emergency parsing');
      }
    }
    
    req.user = decoded; // Add decoded user to request
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Optional authentication for testing
const optionalAuth = (req, res, next) => {
  try {
    authenticateToken(req, res, next);
  } catch (err) {
    // Proceed anyway for testing purposes
    console.warn('Auth token verification failed, but proceeding:', err);
    next();
  }
};

// Function to check roles
const authorizeRole = (roles) => {
  return (req, res, next) => {
    // Ensure authenticateToken middleware ran first and set req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    // Convert roles to array if it's a string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (allowedRoles.includes(req.user.role)) {
      next(); // User has required role
    } else {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
  };
};

// Optional role check for testing
const optionalRoleCheck = (role) => (req, res, next) => {
  if (req.user && req.user.role !== role) {
    console.warn(`Role check failed: expected ${role}, got ${req.user.role}`);
  }
  next();
};

// For backwards compatibility with the existing code
const verifyToken = authenticateToken;
const checkRole = authorizeRole;

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth,
  optionalRoleCheck,
  verifyToken,
  checkRole
};
