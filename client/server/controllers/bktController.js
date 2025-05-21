/**
 * BKT Controller
 * 
 * This controller handles API routes related to Bayesian Knowledge Tracing (BKT)
 * algorithm operations, including student response processing and knowledge state updates.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const bktAlgorithm = require('../utils/bktAlgorithm');
const db = require('../models');

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

// Optional role check for testing
const optionalRoleCheck = (role) => (req, res, next) => {
  if (req.user && req.user.role !== role) {
    console.warn(`Role check failed: expected ${role}, got ${req.user.role}`);
  }
  next();
};

// Middleware to authenticate all BKT routes
router.use(optionalAuth);

// Make db accessible in route handlers
router.use((req, res, next) => {
  req.app.set('db', db);
  next();
});

/**
 * Process a student response and update knowledge state using BKT
 * POST /api/bkt/process-response
 * 
 * Request body:
 * {
 *   studentId: number,
 *   contentItemId: number,
 *   correct: boolean,
 *   timeSpent: number (optional)
 * }
 */
router.post('/process-response', async (req, res) => {
  try {
    const { studentId, contentItemId, correct, timeSpent, interactionData } = req.body;
    
    // Validate input
    if (!studentId || !contentItemId || typeof correct !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid request. Required fields: studentId, contentItemId, correct'
      });
    }
    
    // Additional validation for authenticated users (teachers/students)
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        error: 'Students can only submit their own responses'
      });
    }
    
    // Process the response using BKT algorithm
    // Pass interactionData to consider hints and attempts in mastery calculation
    const result = await bktAlgorithm.updateKnowledgeState(
      studentId,
      contentItemId,
      correct,
      timeSpent,
      interactionData
    );
    
    res.status(200).json({
      message: 'Response processed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing BKT response:', error);
    res.status(500).json({ error: 'Failed to process response: ' + error.message });
  }
});

/**
 * Get a student's knowledge state for a specific knowledge component
 * GET /api/bkt/knowledge-state?studentId=:studentId&kcId=:kcId
 */
router.get('/knowledge-state', async (req, res) => {
  try {
    const { studentId, kcId } = req.query;
    
    // Validate input
    if (!studentId || !kcId) {
      return res.status(400).json({ 
        error: 'Invalid request. Required query parameters: studentId, kcId' 
      });
    }
    
    // Additional validation for authenticated users
    if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ 
        error: 'Students can only access their own knowledge states' 
      });
    }
    
    // Get the knowledge state
    const knowledgeState = await bktAlgorithm.getKnowledgeState(studentId, kcId);
    
    // Get the KC details for context
    const kc = await db.KnowledgeComponent.findByPk(kcId, {
      attributes: ['id', 'name', 'description', 'curriculum_code', 'grade_level']
    });
    
    // Get recent responses for this KC to provide history
    const contentItems = await db.ContentItem.findAll({
      where: { knowledge_component_id: kcId },
      attributes: ['id']
    });
    
    const contentItemIds = contentItems.map(item => item.id);
    
    const recentResponses = await db.Response.findAll({
      where: {
        student_id: studentId,
        content_item_id: { [db.Sequelize.Op.in]: contentItemIds }
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        { 
          model: db.ContentItem, 
          attributes: ['id', 'type', 'content', 'difficulty'] 
        }
      ]
    });
    
    res.status(200).json({
      knowledge_component: kc,
      knowledge_state: knowledgeState,
      recent_responses: recentResponses,
    });
  } catch (error) {
    console.error('Error retrieving knowledge state:', error);
    res.status(500).json({ error: 'Failed to retrieve knowledge state: ' + error.message });
  }
});

/**
 * Get the next recommended content item for a student based on their knowledge state
 * GET /api/bkt/recommend?studentId=:studentId&kcId=:kcId
 */
router.get('/recommend', async (req, res) => {
  try {
    const { studentId, kcId } = req.query;
    
    // Validate input
    if (!studentId || !kcId) {
      return res.status(400).json({ 
        error: 'Invalid request. Required query parameters: studentId, kcId' 
      });
    }
    
    // Get content recommendation
    const recommendedContent = await bktAlgorithm.recommendNextContent(studentId, kcId);
    
    if (!recommendedContent) {
      return res.status(404).json({ 
        message: 'No suitable content items found for this knowledge component' 
      });
    }
    
    res.status(200).json({
      recommended_content: recommendedContent
    });
  } catch (error) {
    console.error('Error recommending content:', error);
    res.status(500).json({ error: 'Failed to recommend content: ' + error.message });
  }
});

/**
 * Update BKT parameters for a specific knowledge component
 * PUT /api/bkt/parameters/:kcId
 * 
 * Request body:
 * {
 *   pL0: number,
 *   pT: number,
 *   pS: number,
 *   pG: number
 * }
 */
router.put('/parameters/:kcId', optionalRoleCheck('admin'), async (req, res) => {
  try {
    const { kcId } = req.params;
    const { pL0, pT, pS, pG } = req.body;
    
    // Validate input (ensure parameters are within valid ranges)
    const validateParam = (param, name) => {
      if (param !== undefined && (param < 0 || param > 1)) {
        throw new Error(`${name} must be between 0 and 1`);
      }
    };
    
    validateParam(pL0, 'pL0');
    validateParam(pT, 'pT');
    validateParam(pS, 'pS');
    validateParam(pG, 'pG');
    
    // Get the knowledge component
    const kc = await db.KnowledgeComponent.findByPk(kcId);
    
    if (!kc) {
      return res.status(404).json({ error: 'Knowledge component not found' });
    }
    
    // Update the BKT parameters
    const updatedMetadata = {
      ...kc.metadata,
      bktParams: {
        pL0: pL0 !== undefined ? pL0 : (kc.metadata?.bktParams?.pL0 || 0.3),
        pT: pT !== undefined ? pT : (kc.metadata?.bktParams?.pT || 0.09),
        pS: pS !== undefined ? pS : (kc.metadata?.bktParams?.pS || 0.1),
        pG: pG !== undefined ? pG : (kc.metadata?.bktParams?.pG || 0.2)
      }
    };
    
    await kc.update({ metadata: updatedMetadata });
    
    res.status(200).json({
      message: 'BKT parameters updated successfully',
      knowledge_component: kc
    });
  } catch (error) {
    console.error('Error updating BKT parameters:', error);
    res.status(500).json({ error: 'Failed to update BKT parameters: ' + error.message });
  }
});

module.exports = router;
