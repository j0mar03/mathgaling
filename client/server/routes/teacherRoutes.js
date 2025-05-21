'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Teacher, Classroom, Student, ClassroomStudent } = db;
const authMiddleware = require('../middleware/authMiddleware');
const teacherController = require('../controllers/teacherController'); // Import the controller

// Create routes even if middleware is disabled for testing
const optionalAuth = (req, res, next) => {
  try {
    authMiddleware.verifyToken(req, res, next);
  } catch (err) {
    // Proceed anyway for testing purposes
    console.warn('Auth token verification failed, but proceeding:', err);
    next();
  }
};

// --- Specific Routes First ---

// Get content items created by the logged-in teacher
router.get('/content-items', authMiddleware.verifyToken, teacherController.getTeacherContentItems);

// Get students eligible to be added by the logged-in teacher
router.get('/eligible-students', authMiddleware.verifyToken, teacherController.getEligibleStudents);

// Get knowledge component mastery data for a teacher
router.get('/:id/knowledge-component-mastery', authMiddleware.verifyToken, teacherController.getTeacherKnowledgeComponentMastery);

// Get classroom performance for a specific knowledge component
router.get('/knowledge-components/:id/classroom-performance', authMiddleware.verifyToken, teacherController.getClassroomPerformance);

// Get content items for a specific knowledge component
router.get('/knowledge-components/:id/content-items', authMiddleware.verifyToken, async (req, res) => {
  try {
    const kcId = parseInt(req.params.id, 10);
    if (isNaN(kcId)) {
      return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
    }

    const contentItems = await db.ContentItem.findAll({
      where: { knowledge_component_id: kcId },
      attributes: ['id', 'type', 'content', 'difficulty', 'metadata', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(contentItems);
  } catch (error) {
    console.error('Error fetching content items:', error);
    res.status(500).json({ error: 'Failed to fetch content items' });
  }
});

// Get a single knowledge component by ID
router.get('/knowledge-components/:id', authMiddleware.verifyToken, async (req, res) => {
  try {
    const kcId = parseInt(req.params.id, 10);
    if (isNaN(kcId)) {
      return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
    }

    const knowledgeComponent = await db.KnowledgeComponent.findByPk(kcId, {
      include: [{
        model: db.ContentItem,
        attributes: ['id', 'type', 'content', 'difficulty', 'metadata']
      }]
    });

    if (!knowledgeComponent) {
      return res.status(404).json({ error: 'Knowledge Component not found' });
    }

    res.json(knowledgeComponent);
  } catch (error) {
    console.error('Error fetching knowledge component:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge component' });
  }
});

// Get classroom performance data for a knowledge component
router.get('/knowledge-components/:id/classroom-performance', authMiddleware.verifyToken, async (req, res) => {
  try {
    const kcId = parseInt(req.params.id, 10);
    if (isNaN(kcId)) {
      return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
    }

    // Get the teacher's classrooms
    const teacherId = req.user.id;
    const classrooms = await db.Classroom.findAll({
      where: { teacher_id: teacherId },
      include: [{
        model: db.Student,
        attributes: ['id']
      }]
    });

    if (!classrooms || classrooms.length === 0) {
      return res.json({
        performance: [],
        masteryDistribution: {
          veryLow: 0,
          low: 0,
          medium: 0,
          high: 0,
          veryHigh: 0
        },
        totalStudents: 0,
        averageMastery: 0
      });
    }

    // Get all student IDs from the classrooms
    const studentIds = classrooms.flatMap(classroom => 
      classroom.Students.map(student => student.id)
    );

    // Get knowledge states and responses for these students and this KC
    const [knowledgeStates, responses] = await Promise.all([
      db.KnowledgeState.findAll({
        where: {
          student_id: studentIds,
          knowledge_component_id: kcId
        }
      }),
      db.Response.findAll({
        where: {
          student_id: studentIds
        },
        include: [{
          model: db.ContentItem,
          where: { knowledge_component_id: kcId },
          attributes: ['id', 'type', 'difficulty']
        }]
      })
    ]);

    // Process student performance data
    const performance = studentIds.map(studentId => {
      const state = knowledgeStates.find(ks => ks.student_id === studentId);
      const studentResponses = responses.filter(r => r.student_id === studentId);
      
      const correctResponses = studentResponses.filter(r => r.correct).length;
      const totalResponses = studentResponses.length;
      const correctRate = totalResponses > 0 ? correctResponses / totalResponses : 0;
      
      const totalTimeSpent = studentResponses.reduce((sum, r) => sum + (r.time_spent || 0), 0);
      const averageTimeSpent = totalResponses > 0 ? totalTimeSpent / totalResponses : 0;

      return {
        studentId,
        mastery: state ? state.p_mastery : 0,
        correctRate,
        totalResponses,
        averageTimeSpent
      };
    });

    // Calculate mastery distribution
    const masteryDistribution = {
      veryLow: 0,
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0
    };

    performance.forEach(p => {
      const mastery = p.mastery;
      if (mastery < 0.2) masteryDistribution.veryLow++;
      else if (mastery < 0.4) masteryDistribution.low++;
      else if (mastery < 0.6) masteryDistribution.medium++;
      else if (mastery < 0.8) masteryDistribution.high++;
      else masteryDistribution.veryHigh++;
    });

    // Calculate average mastery
    const totalMastery = performance.reduce((sum, p) => sum + p.mastery, 0);
    const averageMastery = performance.length > 0 ? totalMastery / performance.length : 0;

    res.json({
      performance,
      masteryDistribution,
      totalStudents: performance.length,
      averageMastery
    });
  } catch (error) {
    console.error('Error fetching classroom performance:', error);
    res.status(500).json({ error: 'Failed to fetch classroom performance data' });
  }
});

// --- Parameterized Routes Last ---

// Get teacher profile (matches /:id)
router.get('/:id', authMiddleware.verifyToken, async (req, res) => {
  // Check if the :id parameter could be one of the specific routes above
  // This prevents '/content-items' or '/eligible-students' from being treated as an ID
  if (req.params.id === 'content-items' || req.params.id === 'eligible-students') {
     // This case should ideally not be reached if routes are ordered correctly,
     // but acts as a safeguard. Pass to next route handler if needed, or return 404.
     return res.status(404).json({ error: 'Resource not found.' });
  }

  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      attributes: { exclude: ['password'] } // Don't send password
    });
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (err) {
    // Handle potential errors if req.params.id is not a valid integer format after all checks
    if (err.name === 'SequelizeDatabaseError' && err.original?.code === '22P02') { // Example check for invalid input syntax
         console.error(`Invalid teacher ID format requested: ${req.params.id}`);
         return res.status(400).json({ error: 'Invalid teacher ID format.' });
    }
    console.error('Error fetching teacher:', err);
    res.status(500).json({ error: 'Failed to fetch teacher profile' });
  }
});

// Get teacher's classrooms
router.get('/:id/classrooms', authMiddleware.verifyToken, async (req, res) => { // Use verifyToken instead of optionalAuth
  try {
    console.log(`[GET /:id/classrooms] Received request for teacher ID: ${req.params.id}`); // Log received ID
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [{
        model: Classroom
      }]
    });
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    console.log(`[GET /:id/classrooms] Found classrooms for teacher ${req.params.id}:`, JSON.stringify(teacher.Classrooms || [], null, 2)); // Log the classrooms found
    res.json(teacher.Classrooms || []);
  } catch (err) {
    console.error('Error fetching teacher\'s classrooms:', err);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// Create new classroom - Use the controller function
router.post('/classrooms', authMiddleware.verifyToken, teacherController.createClassroom);
// Note: Using verifyToken instead of optionalAuth for creation
// Removed old inline handler logic below:
/*
async (req, res) => {
  const { name, teacher_id } = req.body;
  
  if (!name || !teacher_id) {
    return res.status(400).json({ error: 'Classroom name and teacher ID are required' });
  }
  
  // ... rest of old inline logic ...
*/
// Removed classroom-specific routes previously here, now in classroomRoutes.js

module.exports = router;
