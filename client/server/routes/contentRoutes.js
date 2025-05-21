const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { optionalAuth } = require('../middleware/auth');

// Get specific content item
router.get('/:contentId', optionalAuth, contentController.getContentItem);

// Get sequence of content items for quiz
router.get('/kcs/sequence', optionalAuth, contentController.getKcSequence);

// Get content for a specific knowledge component
router.get('/kcs/:kcId', optionalAuth, contentController.getContentForKnowledgeComponent);

// Get a single question for a specific knowledge component
router.get('/kcs/:kcId/question', optionalAuth, contentController.getQuestionForKnowledgeComponent);

// Validate KC existence and accessibility
router.get('/kcs/:kcId/validate', optionalAuth, async (req, res) => {
  try {
    const kcId = parseInt(req.params.kcId, 10);
    if (isNaN(kcId)) {
      return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
    }

    const kc = await db.KnowledgeComponent.findByPk(kcId, {
      attributes: ['id', 'name', 'curriculum_code', 'status']
    });

    if (!kc) {
      return res.status(404).json({ error: 'Knowledge Component not found' });
    }

    if (kc.status !== 'approved') {
      return res.status(403).json({ error: 'Knowledge Component is not available' });
    }

    // If we get here, the KC exists and is accessible
    res.json({ valid: true, kc });
  } catch (error) {
    console.error('Error validating KC:', error);
    res.status(500).json({ error: 'Failed to validate Knowledge Component' });
  }
});

module.exports = router; 