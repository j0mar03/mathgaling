'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Student, KnowledgeState, ContentItem, Response, KnowledgeComponent } = db;
const authMiddleware = require('../middleware/authMiddleware');

// Import the student controller
const studentController = require('../controllers/studentController');
const contentController = require('../controllers/contentController'); // Import contentController

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

// Get all students (for admin and parent selection) 
router.get('/', async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: ['id', 'name', 'grade_level'] // Only send necessary fields
    });
    
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// The user's detailed performance route - IMPORTANT: Place this before /:id routes to avoid parameter conflict
router.get('/me/detailed-performance', authMiddleware.verifyToken, studentController.getOwnDetailedPerformance);

// Route to get the sequence of IDs for specific KCs (used for sequential quiz mode)
router.get('/kcs/sequence', optionalAuth, contentController.getKcSequence);

// Get student profile
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      attributes: { exclude: ['password'] } // Don't send password
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

// Update student profile
router.put('/:id', authMiddleware.verifyToken, studentController.updateStudentProfile);

// Change student password
router.put('/:id/password', authMiddleware.verifyToken, studentController.changeStudentPassword);

// Get student's knowledge states - Use the controller function
router.get('/:id/knowledge-states', optionalAuth, studentController.getKnowledgeStates);

// Get consolidated dashboard data (modules, KCs, states)
router.get('/:id/dashboard', optionalAuth, studentController.getDashboardData);

// Get student's learning path
router.get('/:id/learning-path', optionalAuth, async (req, res) => {
  try {
    // First check if a learning path exists
    const learningPath = await db.LearningPath.findOne({
      where: { student_id: req.params.id }
    });
    
    if (!learningPath) {
      // Create a default learning path if none exists
      const newPath = await db.LearningPath.create({
        student_id: req.params.id,
        status: 'active',
        sequence: []
      });
      
      return res.json({
        id: newPath.id,
        student_id: newPath.student_id,
        status: newPath.status,
        sequence: [],
        knowledge_components: []
      });
    }
    
    // Get associated knowledge components separately
    // Try to safely get knowledge components, regardless of table case sensitivity
    let pathComponents = [];
    try {
      // First attempt - try with case sensitive table name
      pathComponents = await db.sequelize.query(`
        SELECT kc.*, lpc.position, lpc.is_completed, lpc.completed_at 
        FROM "knowledge_components" AS kc
        JOIN "LearningPathComponents" AS lpc ON kc.id = lpc.knowledge_component_id
        WHERE lpc.learning_path_id = :pathId
        ORDER BY lpc.position ASC NULLS LAST, kc.name ASC
      `, {
        replacements: { pathId: learningPath.id },
        type: db.sequelize.QueryTypes.SELECT
      });
    } catch (err) {
      try {
        // Second attempt - try with lowercase table name
        pathComponents = await db.sequelize.query(`
          SELECT kc.*, lpc.position, lpc.is_completed, lpc.completed_at 
          FROM "knowledge_components" AS kc
          JOIN "learningpathcomponents" AS lpc ON kc.id = lpc.knowledge_component_id
          WHERE lpc.learning_path_id = :pathId
          ORDER BY lpc.position ASC NULLS LAST, kc.name ASC
        `, {
          replacements: { pathId: learningPath.id },
          type: db.sequelize.QueryTypes.SELECT
        });
      } catch (innerErr) {
        // Final fallback - return empty array if both fail
        console.warn('Could not get learning path components, using empty array instead');
        pathComponents = [];
      }
    }
    
    // Include the knowledge components in the response
    const result = learningPath.toJSON();
    result.knowledge_components = pathComponents;
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching student\'s learning path:', err);
    res.status(500).json({ error: 'Failed to fetch learning path' });
  }
});

// Contact student
router.post('/:id/contact', authMiddleware.verifyToken, studentController.contactStudent);

// Get kid-friendly next activity recommendation
router.get('/:id/kid-friendly-next-activity', optionalAuth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { current_kc_curriculum_code } = req.query; // KC curriculum code just completed
    const masteryThreshold = 0.8; // Consider KC mastered if mastery is >= this value (80% is reasonable)

    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });

    const student = await Student.findByPk(studentId, { attributes: ['grade_level'] });
    if (!student || !student.grade_level) {
      return res.status(404).json({ error: 'Student not found or grade level not set.' });
    }

    // Fetch all KCs for the student's grade, ordered by curriculum_code
    const allGradeKCs = await KnowledgeComponent.findAll({
      where: { grade_level: student.grade_level },
      order: [['curriculum_code', 'ASC']],
      attributes: ['id', 'name', 'curriculum_code', 'description'],
      raw: true,
    });

    if (!allGradeKCs.length) {
      return res.status(404).json({ error: `No Knowledge Components found for Grade ${student.grade_level}.` });
    }

    // Fetch student's knowledge states for these KCs
    const studentKnowledgeStates = await KnowledgeState.findAll({
      where: {
        student_id: studentId,
        knowledge_component_id: { [db.Sequelize.Op.in]: allGradeKCs.map(kc => kc.id) },
      },
      raw: true,
    });
    const masteryMap = studentKnowledgeStates.reduce((map, state) => {
      map[state.knowledge_component_id] = state.p_mastery;
      return map;
    }, {});

    let nextKc = null;
    
    // First check for most recent quiz KC from responses
    try {
      // Get the student's most recent response to identify the KC they were working on
      const recentResponse = await Response.findOne({
        where: { student_id: studentId },
        order: [['createdAt', 'DESC']],
        include: [{
          model: ContentItem,
          attributes: ['knowledge_component_id']
        }],
        limit: 1
      });
      
      if (recentResponse && recentResponse.ContentItem && recentResponse.ContentItem.knowledge_component_id) {
        // Find this KC in our list of all grade KCs
        const recentKcId = recentResponse.ContentItem.knowledge_component_id;
        const recentKc = allGradeKCs.find(kc => kc.id === recentKcId);
        
        if (recentKc) {
          console.log(`[KidFriendlyNextActivity] Found recent quiz KC: ${recentKc.curriculum_code} (ID: ${recentKc.id})`);
          
          // Get mastery for this KC
          const mastery = masteryMap[recentKc.id] || 0;
          console.log(`[KidFriendlyNextActivity] Current mastery for KC ${recentKc.curriculum_code} is ${mastery * 100}%`);
          
          if (mastery < masteryThreshold) {
            // Continue with this KC if mastery is not yet achieved
            nextKc = recentKc;
            console.log(`[KidFriendlyNextActivity] Using recent quiz KC: ${nextKc.curriculum_code} (Mastery: ${mastery})`);
          } else {
            // If mastered, find the next one in sequence
            const recentKcIndex = allGradeKCs.findIndex(kc => kc.id === recentKc.id);
            console.log(`[KidFriendlyNextActivity] KC index: ${recentKcIndex}, total KCs: ${allGradeKCs.length}`);
            
            if (recentKcIndex !== -1 && recentKcIndex < allGradeKCs.length - 1) {
              // Get next KC in sequence
              nextKc = allGradeKCs[recentKcIndex + 1];
              
              // Check if the next KC already has some mastery
              const nextKcMastery = masteryMap[nextKc.id] || 0;
              console.log(`[KidFriendlyNextActivity] KC ${recentKc.curriculum_code} mastered at ${mastery * 100}%. Next KC ${nextKc.curriculum_code} has mastery of ${nextKcMastery * 100}%`);
              
              // If next KC is also mastered, continue searching
              if (nextKcMastery >= masteryThreshold) {
                console.log(`[KidFriendlyNextActivity] Next KC ${nextKc.curriculum_code} is also mastered, continuing search...`);
                nextKc = null; // Reset so we'll continue searching
                
                // Search for the first non-mastered KC after the recent one
                for (let i = recentKcIndex + 1; i < allGradeKCs.length; i++) {
                  const candidateKc = allGradeKCs[i];
                  const candidateMastery = masteryMap[candidateKc.id] || 0;
                  
                  if (candidateMastery < masteryThreshold) {
                    nextKc = candidateKc;
                    console.log(`[KidFriendlyNextActivity] Found next unmastered KC: ${nextKc.curriculum_code}`);
                    break;
                  }
                }
              } else {
                console.log(`[KidFriendlyNextActivity] Using next KC in sequence: ${nextKc.curriculum_code}`);
              }
            } else if (recentKcIndex === allGradeKCs.length - 1) {
              console.log(`[KidFriendlyNextActivity] Student has mastered the last KC in sequence: ${recentKc.curriculum_code}`);
              return res.json({ message: "Congratulations! You've completed all topics in this sequence!", completed_sequence: true, all_mastered: true });
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[KidFriendlyNextActivity] Error finding recent KC from responses:`, err);
      // Continue with standard logic if there's an error
    }

    // If we haven't found a KC from recent quiz responses, use the standard logic
    if (!nextKc && current_kc_curriculum_code) {
      const currentKcIndex = allGradeKCs.findIndex(kc => kc.curriculum_code === current_kc_curriculum_code);
      if (currentKcIndex !== -1 && currentKcIndex < allGradeKCs.length - 1) {
        nextKc = allGradeKCs[currentKcIndex + 1];
        console.log(`[KidFriendlyNextActivity] Student completed ${current_kc_curriculum_code}. Next in sequence is ${nextKc.curriculum_code}`);
      } else if (currentKcIndex === allGradeKCs.length - 1) {
        console.log(`[KidFriendlyNextActivity] Student completed the last KC in sequence: ${current_kc_curriculum_code}`);
        // Optionally, recommend revisiting lowest mastery or just indicate completion
        return res.json({ message: "Congratulations! You've completed all topics in this sequence!", completed_sequence: true });
      } else {
         console.warn(`[KidFriendlyNextActivity] Completed KC ${current_kc_curriculum_code} not found in sequence for grade ${student.grade_level}. Falling back to first unmastered.`);
         // Fall through to find first unmastered if current_kc_curriculum_code is invalid or not found
      }
    }
    
    if (!nextKc) { // If no recent KC or current_kc_curriculum_code, or if fallback is needed
      for (const kc of allGradeKCs) {
        const mastery = masteryMap[kc.id] || 0; // Default to 0 if no state exists
        if (mastery < masteryThreshold) {
          nextKc = kc;
          console.log(`[KidFriendlyNextActivity] Found first unmastered KC: ${nextKc.curriculum_code} (Mastery: ${mastery})`);
          break;
        }
      }
    }

    if (!nextKc) {
      // All KCs in the sequence are considered mastered
      console.log(`[KidFriendlyNextActivity] All KCs for Grade ${student.grade_level} appear to be mastered.`);
      // Recommend the first KC in the sequence for review, or indicate completion
      // For now, let's indicate completion if all are mastered.
      return res.json({ message: "Wow! You've mastered all topics for your grade level!", all_mastered: true });
    }

    // We have a nextKc, now find a content item for it
    const contentItem = await ContentItem.findOne({
      where: { knowledge_component_id: nextKc.id, type: { [db.Sequelize.Op.ne]: 'lesson' } }, // Exclude lessons for now
      order: db.Sequelize.literal('RANDOM()'), // Get a random question
      attributes: ['id', 'type'],
    });

    if (!contentItem) {
      console.warn(`[KidFriendlyNextActivity] No suitable content items found for next KC: ${nextKc.name} (ID: ${nextKc.id})`);
      return res.status(404).json({ error: `No practice content available for the next topic: ${nextKc.name}. Please try again later or ask your teacher.` });
    }
    
    const currentMastery = masteryMap[nextKc.id] || 0;
    const masteryPercentage = Math.round(currentMastery * 100);

    // Simplified name and emoji logic (can be reused or adapted)
    let simplifiedName = nextKc.name.replace(/^KC\d+:\s*/, ''); // Remove "KCx: " prefix
    if (simplifiedName.length > 30) simplifiedName = simplifiedName.substring(0,27) + "...";

    let topicEmoji = "📝"; // Default
    if (simplifiedName.toLowerCase().includes("number")) topicEmoji = "🔢";
    else if (simplifiedName.toLowerCase().includes("add")) topicEmoji = "➕";
    else if (simplifiedName.toLowerCase().includes("subtract")) topicEmoji = "➖";
    else if (simplifiedName.toLowerCase().includes("multiply")) topicEmoji = "✖️";
    else if (simplifiedName.toLowerCase().includes("divid")) topicEmoji = "➗";
    else if (simplifiedName.toLowerCase().includes("money")) topicEmoji = "💰";
    else if (simplifiedName.toLowerCase().includes("place value")) topicEmoji = "🔣";
    else if (simplifiedName.toLowerCase().includes("compar")) topicEmoji = "⚖️";
    else if (simplifiedName.toLowerCase().includes("order")) topicEmoji = "📊";
    else if (simplifiedName.toLowerCase().includes("round")) topicEmoji = "🔄";
    else if (simplifiedName.toLowerCase().includes("fraction")) topicEmoji = "½";
     else if (simplifiedName.toLowerCase().includes("ordinal")) topicEmoji = "🏅";


    res.json({
      id: contentItem.id, // This is a content_item_id, used by QuizView to load the specific question via /api/content/:id
      kc_id: nextKc.id,   // The actual KC ID for QuizView to know which KC this content belongs to
      name: simplifiedName,
      curriculum_code: nextKc.curriculum_code, // Important for frontend to pass back
      emoji: topicEmoji,
      mastery: masteryPercentage,
      description: nextKc.description || (masteryPercentage < 30 ? "Let's learn something new!" : masteryPercentage < 70 ? "Let's practice more!" : "Let's master this!"),
      activityType: contentItem.type, // e.g., 'multiple_choice'
      type: 'kc', // To tell the dashboard this is a KC-specific activity
      difficulty: masteryPercentage < 30 ? "easy" : masteryPercentage < 70 ? "medium" : "challenging",
    });

  } catch (error) {
    console.error("Error in getKidFriendlyNextActivity:", error);
    res.status(500).json({ error: 'Failed to get next kid-friendly activity' });
  }
});

// Get recommended content for student
router.get('/:id/recommended-content', optionalAuth, async (req, res) => {
  try {
    console.log("[recommended-content] Fetching available quiz questions");
    
    // Get the student ID from request params
    const studentId = parseInt(req.params.id, 10);
    
    // Get the knowledge component ID from query params if provided
    const kcId = req.query.kc_id ? parseInt(req.query.kc_id, 10) : null;
    
    // Get recently answered content items to avoid recommending them again
    // But only exclude the most recent ones to ensure we have enough questions
    const recentAnswers = await db.Response.findAll({
      where: {
        student_id: studentId,
        createdAt: {
          [db.Sequelize.Op.gt]: new Date(Date.now() - 5 * 60 * 1000) // Only exclude responses in the last 5 minutes
        }
      },
      attributes: ['content_item_id'],
      raw: true,
      limit: 3 // Only exclude the 3 most recent answers
    });
    
    const answeredItemIds = recentAnswers.map(r => r.content_item_id);
    console.log(`[recommended-content] Recently answered item IDs: ${answeredItemIds.join(',') || 'none'}`);
    
    // Find eligible content items (questions only)
    const whereClause = {
      // Only include question-type content
      type: {
        [db.Sequelize.Op.in]: ['multiple_choice', 'question', 'fill_in_blank', 'computation', 'word_problem']
      }
    };
    
    // If a specific KC ID is provided, filter by that KC
    if (kcId) {
      whereClause.knowledge_component_id = kcId;
    }
    
    // Exclude recently answered questions if there are any
    if (answeredItemIds.length > 0) {
      whereClause.id = { [db.Sequelize.Op.notIn]: answeredItemIds };
    }
    
    // Find all eligible questions
    const contentItems = await db.ContentItem.findAll({
      where: whereClause,
      include: [{
        model: db.KnowledgeComponent,
        attributes: ['id', 'curriculum_code', 'name']
      }],
      limit: 16, // Increased limit to ensure we have enough questions
      order: db.Sequelize.literal('RANDOM()') // Randomize the results
    });
    
    if (!contentItems || contentItems.length === 0) {
      console.warn(`[recommended-content] No eligible quiz questions found`);
      return res.json([]); // Return empty array if no items found
    }
    
    // If a specific KC was requested, ensure we only return questions for that KC
    const filteredItems = kcId ? 
      contentItems.filter(item => item.knowledge_component_id === kcId) :
      contentItems;
    
    if (filteredItems.length === 0) {
      console.warn(`[recommended-content] No questions found for KC ${kcId}`);
      return res.json([]);
    }
    
    console.log(`[recommended-content] Found ${filteredItems.length} eligible quiz questions`);
    
    // Return the filtered items
    res.json(filteredItems);
  } catch (err) {
    console.error('Error fetching recommended content:', err);
    res.status(500).json({ error: 'Failed to fetch recommended content' });
  }
});


// Get challenge quiz questions (difficulty-based from random KCs)
router.get('/:id/challenge-quiz', optionalAuth, async (req, res) => {
  try {
    console.log("[challenge-quiz] Fetching challenge quiz questions");
    
    const studentId = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit) || 8;
    
    // Get student's knowledge states to determine difficulty levels
    const knowledgeStates = await db.KnowledgeState.findAll({
      where: { student_id: studentId },
      include: [{
        model: db.KnowledgeComponent,
        as: 'KnowledgeComponent'
      }]
    });
    
    // Calculate overall mastery to determine challenge difficulty
    const totalMastery = knowledgeStates.reduce((sum, state) => sum + (state.p_mastery || 0), 0);
    const averageMastery = knowledgeStates.length > 0 ? totalMastery / knowledgeStates.length : 0;
    
    // Determine difficulty tier based on student's overall mastery
    let targetDifficulty;
    if (averageMastery >= 0.8) {
      targetDifficulty = [4, 5]; // Advanced - highest difficulty
    } else if (averageMastery >= 0.6) {
      targetDifficulty = [3, 4]; // Intermediate-Advanced
    } else if (averageMastery >= 0.4) {
      targetDifficulty = [2, 3]; // Beginner-Intermediate
    } else {
      targetDifficulty = [1, 2]; // Starter-Beginner
    }
    
    console.log(`[challenge-quiz] Student average mastery: ${(averageMastery * 100).toFixed(1)}%, Target difficulty: ${targetDifficulty.join(',')}`);
    
    // Get recently answered content items to avoid repetition
    const recentAnswers = await db.Response.findAll({
      where: {
        student_id: studentId,
        createdAt: {
          [db.Sequelize.Op.gt]: new Date(Date.now() - 30 * 60 * 1000) // Exclude responses in the last 30 minutes
        }
      },
      attributes: ['content_item_id'],
      raw: true,
      limit: 10
    });
    
    const answeredItemIds = recentAnswers.map(r => r.content_item_id);
    
    // Build where clause for challenge questions
    const whereClause = {
      type: {
        [db.Sequelize.Op.in]: ['multiple_choice', 'question', 'fill_in_blank', 'computation', 'word_problem']
      },
      difficulty: {
        [db.Sequelize.Op.in]: targetDifficulty
      }
    };
    
    // Exclude recently answered questions
    if (answeredItemIds.length > 0) {
      whereClause.id = { [db.Sequelize.Op.notIn]: answeredItemIds };
    }
    
    // Find all eligible challenge questions
    const contentItems = await db.ContentItem.findAll({
      where: whereClause,
      include: [{
        model: db.KnowledgeComponent,
        as: 'KnowledgeComponent',
        attributes: ['id', 'name', 'curriculum_code']
      }],
      order: db.Sequelize.literal('RANDOM()'), // Random selection
      limit: limit * 2 // Get more than needed to ensure variety
    });
    
    if (contentItems.length === 0) {
      console.warn(`[challenge-quiz] No challenge questions found for difficulty levels ${targetDifficulty.join(',')}`);
      return res.json([]);
    }
    
    // Group questions by KC to ensure variety
    const questionsByKC = {};
    contentItems.forEach(item => {
      const kcId = item.knowledge_component_id;
      if (!questionsByKC[kcId]) {
        questionsByKC[kcId] = [];
      }
      questionsByKC[kcId].push(item);
    });
    
    // Select questions from different KCs to create variety
    const selectedQuestions = [];
    const kcIds = Object.keys(questionsByKC);
    let kcIndex = 0;
    
    while (selectedQuestions.length < limit && selectedQuestions.length < contentItems.length) {
      const currentKcId = kcIds[kcIndex % kcIds.length];
      const kcQuestions = questionsByKC[currentKcId];
      
      if (kcQuestions.length > 0) {
        const question = kcQuestions.shift(); // Take and remove first question
        selectedQuestions.push(question);
      }
      
      kcIndex++;
      
      // If we've cycled through all KCs and some have no more questions, remove them
      if (kcIndex % kcIds.length === 0) {
        for (let i = kcIds.length - 1; i >= 0; i--) {
          if (questionsByKC[kcIds[i]].length === 0) {
            kcIds.splice(i, 1);
          }
        }
        if (kcIds.length === 0) break;
      }
    }
    
    console.log(`[challenge-quiz] Selected ${selectedQuestions.length} questions from ${Object.keys(questionsByKC).length} different KCs`);
    
    res.json(selectedQuestions);
  } catch (err) {
    console.error('Error fetching challenge quiz:', err);
    res.status(500).json({ error: 'Failed to fetch challenge quiz' });
  }
});

// Submit a response to content
router.post('/:id/responses', optionalAuth, studentController.processResponse);

// Get student responses (can be filtered by kc_id)
router.get('/:id/responses', optionalAuth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const kcId = req.query.kc_id ? parseInt(req.query.kc_id, 10) : null;

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }

    // Build query conditions
    const whereConditions = { student_id: studentId };
    
    // Include content item to filter by KC
    let includeOptions = [{
      model: db.ContentItem,
      attributes: ['knowledge_component_id']
    }];
    
    // If KC ID is provided, filter responses to only those for that KC
    const responses = await db.Response.findAll({
      where: whereConditions,
      include: includeOptions,
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit to recent responses
    });
    
    // If KC ID was provided, filter responses to only those for that KC
    const filteredResponses = kcId 
      ? responses.filter(r => r.ContentItem?.knowledge_component_id === kcId)
      : responses;

    res.json(filteredResponses);
  } catch (err) {
    console.error('Error fetching student responses:', err);
    res.status(500).json({ error: 'Failed to fetch student responses' });
  }
});

// Get detailed performance for a specific student (e.g., for parent/teacher view)
// Ensure this controller function exists and handles fetching data appropriately
router.get('/:id/detailed-performance', optionalAuth, studentController.getDetailedPerformanceById);

// Get struggling KCs for a student
router.get('/:id/struggling-kcs', optionalAuth, studentController.getStrugglingKCs);

// Update student intervention settings
router.post('/:id/intervention-settings', optionalAuth, studentController.updateInterventionSettings);

// Get student progress data
router.get('/:id/progress', optionalAuth, studentController.getStudentProgress);

// Get knowledge components for student's grade level
router.get('/:id/grade-knowledge-components', authMiddleware.verifyToken, studentController.getStudentKnowledgeComponents);

module.exports = router;
