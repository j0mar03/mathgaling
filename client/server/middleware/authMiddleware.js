'use strict';

const jwt = require('jsonwebtoken');

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
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
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
