/**
 * Route registration module
 * 
 * This file centralizes all route registrations for the application
 */

const express = require('express');
// Include all route files
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');
const parentRoutes = require('./parentRoutes');
const adminRoutes = require('./adminRoutes');
const classroomRoutes = require('./classroomRoutes'); // Import the new classroom routes
const messageRoutes = require('./messageRoutes'); // Import the message routes
const contentController = require('../controllers/contentController');
const { optionalAuth } = require('../middleware/authMiddleware');

// PDF content routes
const pdfContentRoutes = require('./pdfContentRoutes');
const adminPdfContentRoutes = require('./adminPdfContentRoutes');

// Function to register all routes on the Express app
const registerRoutes = (app) => {
  // Auth routes - using auth controller directly for now
  const authController = require('../controllers/authController');
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/register/student', authController.registerStudent);
  app.post('/api/auth/register/teacher', authController.registerTeacher);
  app.post('/api/auth/register/parent', authController.registerParent);
  
  // User role-specific routes
  app.use('/api/students', studentRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/parents', parentRoutes);
  
  // Admin routes for user and knowledge component management
  app.use('/api/admin', adminRoutes);
  
  // PDF curriculum content management routes
  app.use('/api/pdf-content', pdfContentRoutes);
  app.use('/api/admin/pdf-content', adminPdfContentRoutes);
  
  // Create an API endpoint for BKT algorithm updates
  const bktController = require('../controllers/bktController');
  app.use('/api/bkt', bktController);
  
  // Classroom management routes
  // app.use('/api/classrooms', teacherRoutes); // REMOVED incorrect double mounting
  app.use('/api/classrooms', classroomRoutes); // Mount the dedicated classroom routes
  
  // Messages routes
  app.use('/api/messages', messageRoutes); // Mount the message routes
  
  // Content routes
  app.get('/api/content/:contentId', optionalAuth, contentController.getContentItem);
  app.get('/api/knowledge-components/:kcId/content', optionalAuth, contentController.getContentForKnowledgeComponent); // Gets all content for a KC
  app.get('/api/kcs/:kcId/question', optionalAuth, contentController.getQuestionForKnowledgeComponent); // Gets a single question for a KC
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });
  
  // API 404 handler
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });
};

module.exports = registerRoutes;
