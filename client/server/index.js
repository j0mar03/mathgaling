require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const path = require('path');
// Old SQLite DB removed - Sequelize DB imported below
const db = require('./models'); // Import Sequelize instance and models
const app = express();

// Old non-Sequelize models removed

// Import controllers
const studentController = require('./controllers/studentController');
const teacherController = require('./controllers/teacherController');
const parentController = require('./controllers/parentController');
const contentController = require('./controllers/contentController'); // Import Content Controller
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController'); // Import Admin Controller
const { authenticateToken, authorizeRole, optionalAuth, optionalRoleCheck } = require('./middleware/authMiddleware'); // Import Auth Middleware

// Import route modules
const registerRoutes = require('./routes'); // Import centralized route registration

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint for Render.com
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve uploaded files statically
// IMPORTANT: Ensure this path is correct relative to where the server is run (index.js)
app.use('/uploads/pdf', express.static(path.join(__dirname, 'uploads/pdf')));
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// Removed sample data imports and initialization logic

// Auth routes - must be registered before centralized routes to avoid being overridden by the catch-all
app.post('/api/auth/register/student', authController.registerStudent); // Renamed for consistency
app.post('/api/auth/register/teacher', authController.registerTeacher); // Added teacher registration route
app.post('/api/auth/register/parent', authController.registerParent);   // Added parent registration route
app.post('/api/auth/login', authController.login);

// Register routes from the centralized module - will include our new routes
registerRoutes(app);

// Redundant routes removed. Routes are now handled by registerRoutes(app) above.

// Catch-all handler for client-side routing (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Use port 5001 as default, or PORT env variable if set
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
