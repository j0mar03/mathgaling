// This file is a serverless function entry point for Vercel
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('../server/models');
const registerRoutes = require('../server/routes');
const authController = require('../server/controllers/authController');
const { authenticateToken, authorizeRole, optionalAuth } = require('../server/middleware/authMiddleware');

// Create express instance
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Auth routes - must be registered before centralized routes
app.post('/api/auth/register/student', authController.registerStudent);
app.post('/api/auth/register/teacher', authController.registerTeacher);
app.post('/api/auth/register/parent', authController.registerParent);
app.post('/api/auth/login', authController.login);

// Register routes from the centralized module
registerRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export the Express API
module.exports = app;