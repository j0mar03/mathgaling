'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Classroom, Student, ClassroomStudent, KnowledgeState, Response } = db; // Include necessary models
const authMiddleware = require('../middleware/authMiddleware');
const teacherController = require('../controllers/teacherController'); // Contains the logic

// Middleware for these routes
router.use(authMiddleware.verifyToken); // Apply auth to all classroom routes

// --- Routes specific to a Classroom ID ---
// Base path is /api/classrooms

// GET /api/classrooms/:id - Get specific classroom details (ensure teacher owns it)
router.get('/:id', teacherController.getClassroomById);

// GET /api/classrooms/:id/students - Get students in a specific classroom
router.get('/:id/students', teacherController.getClassroomStudents);

// GET /api/classrooms/:id/performance - Get student performance summary for a classroom
// Note: Using the existing inline handler from teacherRoutes temporarily, should be moved to controller
router.get('/:id/performance', async (req, res) => {
  try {
    // Fetch real students from the classroom
    const classroomStudents = await ClassroomStudent.findAll({
      where: { classroom_id: req.params.id },
      include: [{ model: Student, as: 'Student' }] // Add the alias 'Student' here
    });
    
    if (!classroomStudents || classroomStudents.length === 0) {
      return res.json([]);
    }
    
    // Get student IDs from the classroom
    const studentIds = classroomStudents.map(cs => cs.Student.id);
    
    // Fetch actual knowledge states for these students
    const knowledgeStates = await db.KnowledgeState.findAll({
      where: { student_id: { [db.Sequelize.Op.in]: studentIds } },
      attributes: ['student_id', 'knowledge_component_id', 'p_mastery']
    });
    
    // Fetch recent responses for activity data
    const responses = await db.Response.findAll({
      where: { student_id: { [db.Sequelize.Op.in]: studentIds } },
      attributes: ['student_id', 'correct', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    // Process the data for each student
    const performanceData = await Promise.all(classroomStudents.map(async cs => {
      const student = cs.Student;
      
      // Calculate average mastery from knowledge states
      const studentKnowledgeStates = knowledgeStates.filter(ks => ks.student_id === student.id);
      let averageMastery = 0;
      let mathMastery = 0;
      
      if (studentKnowledgeStates.length > 0) {
        const totalMastery = studentKnowledgeStates.reduce((sum, state) => sum + state.p_mastery, 0);
        averageMastery = totalMastery / studentKnowledgeStates.length;
        
        // Calculate math mastery specifically
        // Get all knowledge components for these states to check if they are math-related
        const kcIds = studentKnowledgeStates.map(ks => ks.knowledge_component_id);
        const knowledgeComponents = await db.KnowledgeComponent.findAll({
          where: { id: { [db.Sequelize.Op.in]: kcIds } }
        });
        
        // Filter for math-related KCs and calculate math mastery
        const mathKnowledgeStates = studentKnowledgeStates.filter(ks => {
          const kc = knowledgeComponents.find(k => k.id === ks.knowledge_component_id);
          // Consider all KCs as math-related in this educational system
          return kc;
        });
        
        if (mathKnowledgeStates.length > 0) {
          const mathMasterySum = mathKnowledgeStates.reduce((sum, state) => sum + state.p_mastery, 0);
          mathMastery = mathMasterySum / mathKnowledgeStates.length;
        }
      }
      
      // Get recent activity
      const studentResponses = responses.filter(r => r.student_id === student.id);
      const lastActivity = studentResponses.length > 0 ? studentResponses[0].createdAt : null;
      const completedItems = studentResponses.length;
      
      // Enhanced intervention logic with BKT and fuzzy logic
      let needsIntervention = false;
      let priority = null;
      let recommendations = null;
      let interventionScore = null;
      let recommendedKCs = []; // Array to store recommended knowledge components

      // Only consider intervention if student has attempted at least 5 items
      if (completedItems >= 5) {
        // Calculate BKT-based mastery probability
        const recentResponses = studentResponses.slice(0, 10);
        const correctCount = recentResponses.filter(r => r.correct).length;
        const pCorrect = correctCount / recentResponses.length;
        
        // Calculate learning rate
        let learningRate = 0;
        if (recentResponses.length >= 3) {
          const timePoints = recentResponses.map((_, i) => i);
          const performancePoints = recentResponses.map(r => r.correct ? 1 : 0);
          const n = timePoints.length;
          const sumX = timePoints.reduce((a, b) => a + b, 0);
          const sumY = performancePoints.reduce((a, b) => a + b, 0);
          const sumXY = timePoints.reduce((a, b, i) => a + b * performancePoints[i], 0);
          const sumXX = timePoints.reduce((a, b) => a + b * b, 0);
          learningRate = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        }

        // Fuzzy logic for intervention decision
        const masteryScore = averageMastery;
        const recentPerformanceScore = pCorrect;
        const learningTrendScore = Math.max(0, Math.min(1, learningRate + 0.5));

        // Calculate intervention score
        interventionScore = (
          masteryScore * 0.4 +
          recentPerformanceScore * 0.4 +
          learningTrendScore * 0.2
        );

        // Find knowledge components that need improvement
        const strugglingKCs = studentKnowledgeStates
          .filter(state => state.p_mastery < 0.7) // KCs with mastery below 70%
          .sort((a, b) => a.p_mastery - b.p_mastery) // Sort by lowest mastery first
          .slice(0, 3); // Get top 3 struggling KCs

        // Get recommended content for struggling KCs
        recommendedKCs = await Promise.all(strugglingKCs.map(async kc => {
          // Find content items for this KC
          const contentItems = await db.ContentItem.findAll({
            where: { knowledge_component_id: kc.knowledge_component_id },
            attributes: ['id', 'content', 'type', 'difficulty'],
            order: [['difficulty', 'ASC']], // Start with easier content
            limit: 2 // Get 2 items per KC
          });

          return {
            kc_id: kc.knowledge_component_id,
            kc_name: kc.KnowledgeComponent?.name || 'Unknown KC',
            kc_code: kc.KnowledgeComponent?.curriculum_code || 'Unknown',
            current_mastery: (kc.p_mastery * 100).toFixed(0),
            recommended_content: contentItems.map(item => ({
              id: item.id,
              title: item.content,
              type: item.type,
              difficulty: item.difficulty
            }))
          };
        }));

        // Determine intervention need and priority
        if (interventionScore < 0.3) {
          needsIntervention = true;
          priority = 'High';
          recommendations = {
            difficulty: 'Provide significantly easier content to build foundational understanding',
            hints: 'Offer detailed step-by-step hints and explanations',
            pacing: 'Allow extended time for practice and review',
            focus: 'Focus on basic concepts and prerequisite skills',
            recommended_kcs: recommendedKCs
          };
        } else if (interventionScore < 0.5) {
          needsIntervention = true;
          priority = 'Medium';
          recommendations = {
            difficulty: 'Mix of easy and moderate content with gradual progression',
            hints: 'Provide strategic hints at key decision points',
            pacing: 'Regular practice with immediate feedback',
            focus: 'Address specific misconceptions and gaps',
            recommended_kcs: recommendedKCs
          };
        } else if (interventionScore < 0.7) {
          needsIntervention = true;
          priority = 'Low';
          recommendations = {
            difficulty: 'Focus on challenging content with support',
            hints: 'Minimal hints to encourage independence',
            pacing: 'Maintain current pace with targeted review',
            focus: 'Reinforce understanding of complex concepts',
            recommended_kcs: recommendedKCs
          };
        }
      }
      
      return {
        student: {
          id: student.id,
          name: student.name,
          grade_level: student.grade_level
        },
        performance: {
          averageMastery: averageMastery,
          mathMastery: mathMastery,
          lastActive: lastActivity,
          completedItems: completedItems,
          interventionScore: interventionScore
        },
        intervention: needsIntervention ? {
          needed: true,
          priority: priority,
          recommendations: recommendations,
          recommended_kcs: recommendedKCs
        } : {
          needed: false
        }
      };
    }));
    
    res.json(performanceData);
  } catch (err) {
    console.error('Error fetching classroom performance:', err);
    res.status(500).json({ error: 'Failed to fetch classroom performance' });
  }
});

// GET /api/classrooms/:id/knowledge-components - Get class-wide KC performance
router.get('/:id/knowledge-components', teacherController.getClassKnowledgeComponentPerformance);

// POST /api/classrooms/:id/students - Add students to classroom
// Note: Using the existing inline handler from teacherRoutes temporarily, should be moved to controller
router.post('/:id/students', async (req, res) => {
  const { studentIds } = req.body;
  const classroomId = parseInt(req.params.id);
  
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Student IDs are required' });
  }
  
  try {
    // Verify classroom exists
    const classroom = await Classroom.findByPk(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    // Verify students exist
    const students = await Student.findAll({
      where: { id: studentIds }
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'One or more students not found' });
    }
    
    // Create classroom-student links
    const links = studentIds.map(studentId => ({
      classroom_id: classroomId,
      student_id: studentId,
      joined_at: new Date()
    }));
    
    await ClassroomStudent.bulkCreate(links, {
      ignoreDuplicates: true // In case links already exist
    });
    
    res.json({
      message: 'Students added to classroom successfully',
      links: links
    });
  } catch (err) {
    console.error('Error adding students to classroom:', err);
    res.status(500).json({ error: 'Failed to add students to classroom' });
  }
});

// DELETE /api/classrooms/:classroomId/students/:studentId - Remove a student
router.delete('/:classroomId/students/:studentId', teacherController.removeStudentFromClassroom);


module.exports = router;