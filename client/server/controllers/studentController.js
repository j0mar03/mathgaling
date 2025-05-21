// --- CONTROLLER VERSION CHECK: V3 ---
/**
 * Student Controller
 *
 * This controller handles API routes related to student operations,
 * including knowledge tracking, content recommendations, and learning paths.
 */
console.log("--- Loading studentController.js - V3 ---"); // Add unique log

const db = require('../models'); // Import Sequelize db object
const { updateKnowledgeState, recommendNextContent } = require('../utils/bktAlgorithm'); // Import BKT and recommendation functions

// Send a message to a student (from a teacher)
exports.contactStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }

    const { message, studentName } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify that the student exists
    const student = await db.Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get the teacher info from the request (from auth middleware)
    const teacherId = req.user.id;
    const teacher = await db.Teacher.findByPk(teacherId);

    if (!teacher) {
      return res.status(403).json({ error: 'Only teachers can contact students' });
    }

    // Create a new message record
    const messageRecord = await db.Message.create({
      from_user_id: teacherId,
      from_user_type: 'teacher',
      to_user_id: studentId,
      to_user_type: 'student',
      message: message,
      read: false,
      sent_at: new Date()
    });

    // Also create a notification for the student
    await db.Notification.create({
      user_id: studentId,
      user_type: 'student',
      title: `New message from ${teacher.name}`,
      message: `Your teacher has sent you a message.`,
      type: 'message',
      read: false,
      reference_id: messageRecord.id,
      created_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: messageRecord.id
    });

  } catch (error) {
    console.error('Error sending message to student:', error);
    res.status(500).json({ error: 'Failed to send message to student' });
  }
};

// Get student profile
exports.getStudentProfile = async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id; // From authenticateToken middleware

    // Ensure the authenticated user is requesting their own profile
    if (requestedId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own profile.' });
    }

    const student = await db.Student.findByPk(requestedId); // Use Sequelize findByPk
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
};

// Update student profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id; // From authenticateToken middleware

    // Ensure the authenticated user is updating their own profile
    if (requestedId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }

    // Prevent updating sensitive fields like id, role, auth_id, password, timestamps
    const { id: reqId, role, auth_id, password, createdAt, updatedAt, ...updateData } = req.body;

    // Validate favorite_color if it's being updated
    if (updateData.favorite_color && !/^#[0-9A-Fa-f]{6}$/.test(updateData.favorite_color)) {
      return res.status(400).json({ error: 'Invalid color format. Please use a valid hex color code (e.g., #4a90e2).' });
    }

    const [affectedRows] = await db.Student.update(updateData, {
      where: { id: requestedId }
    });

    if (affectedRows > 0) {
      const updatedStudent = await db.Student.findByPk(requestedId);
      res.json(updatedStudent);
    } else {
      // Check if student exists before saying not found vs no changes
      const studentExists = await db.Student.findByPk(requestedId);
      if (!studentExists) {
         return res.status(404).json({ error: 'Student not found' });
      }
      // If student exists but no rows affected, likely no changes needed or data was same
      const currentStudent = await db.Student.findByPk(requestedId); // Return current data
      res.json(currentStudent);
    }
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ error: 'Failed to update student profile' });
  }
};

// Get student knowledge states
exports.getKnowledgeStates = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
       return res.status(400).json({ error: 'Invalid Student ID' });
    }
    // Fetch only KnowledgeState data first
    const statesRaw = await db.KnowledgeState.findAll({
      where: { student_id: studentId },
      attributes: ['id', 'student_id', 'knowledge_component_id', 'p_mastery', 'p_transit', 'p_guess', 'p_slip', 'createdAt', 'updatedAt'], // Select all KS fields
      raw: true // Get plain objects
    });

    // Get unique KC IDs
    const kcIds = [...new Set(statesRaw.map(s => s.knowledge_component_id))];

    // Fetch associated KnowledgeComponent details separately
    const knowledgeComponents = await db.KnowledgeComponent.findAll({
      where: { id: kcIds },
      attributes: ['id', 'name', 'curriculum_code'], // Select only needed KC fields
      raw: true // Get plain objects
    });

    // Create a map for easy lookup
    const kcMap = knowledgeComponents.reduce((map, kc) => {
      map[kc.id] = kc;
      return map;
    }, {});

    // Combine the data
    const states = statesRaw.map(state => ({
      ...state,
      KnowledgeComponent: kcMap[state.knowledge_component_id] || null // Attach KC details
    }));
    res.json(states);
  } catch (error) {
    console.error("Error fetching knowledge states:", error);
    res.status(500).json({ error: 'Failed to fetch knowledge states' });
  }
};

// Process student response to a question
exports.processResponse = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { content_item_id, answer, correct, time_spent, interaction_data, practice_mode } = req.body;

    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });
    if (isNaN(parseInt(content_item_id, 10))) return res.status(400).json({ error: 'Invalid Content Item ID' });
    if (typeof correct !== 'boolean') return res.status(400).json({ error: 'Missing or invalid "correct" field' });

    // 1. Find the content item to get the associated knowledge component ID
    const contentItem = await db.ContentItem.findByPk(content_item_id, {
      attributes: ['knowledge_component_id']
    });
    if (!contentItem || !contentItem.knowledge_component_id) {
      return res.status(404).json({ error: 'Content item or associated knowledge component not found' });
    }
    const kcId = contentItem.knowledge_component_id;

    // 4. Create the response record
    const responseRecord = await db.Response.create({
      student_id: studentId,
      content_item_id: content_item_id,
      answer: answer,
      correct: correct,
      time_spent: time_spent,
      interaction_data: {
        ...interaction_data,
        practice_mode: practice_mode || false
      }
    });

    // If this is practice mode, don't update the knowledge state
    let newMastery = 0;
    let knowledgeState = null;
    
    if (!practice_mode) {
      // 2. Find or create the student's knowledge state for this component
      knowledgeState = await db.KnowledgeState.findOne({
        where: { student_id: studentId, knowledge_component_id: kcId }
      });

      if (!knowledgeState) {
        knowledgeState = await db.KnowledgeState.create({
          student_id: studentId,
          knowledge_component_id: kcId
        });
      }

      // 3. Update knowledge state using BKT
      const updateResult = await updateKnowledgeState(studentId, content_item_id, correct, time_spent, interaction_data);
      newMastery = updateResult.newMastery;
    }

    // 5. Get the next content item ID for sequential mode
    let nextContentItemId = null;
    if (req.query.mode === 'sequential' && !practice_mode) {
      // kcId is the knowledge_component_id of the *current* content item.
      // This logic provides a fallback next question if QuizView isn't using its own pre-fetched sequence.
      const nextQuestionInSameKc = await db.ContentItem.findOne({
        where: {
          knowledge_component_id: kcId, // Stay within the same KC
          type: { [db.Sequelize.Op.in]: ['multiple_choice', 'fill_in_blank', 'question', 'computation', 'word_problem'] },
          id: { [db.Sequelize.Op.ne]: content_item_id } // Exclude the current question
        },
        order: db.Sequelize.literal('RANDOM()'), // Pick another random question from the same KC
        attributes: ['id'],
        raw: true
      });

      if (nextQuestionInSameKc) {
        nextContentItemId = nextQuestionInSameKc.id;
        console.log(`[processResponse] Next sequential question in same KC ${kcId}: ${nextContentItemId}`);
      } else {
        // This means no *other* question was found in this KC.
        // QuizView.js, using its fetched sequence from getKcSequence, should handle the end of its list.
        console.log(`[processResponse] No other sequential question found in same KC ${kcId} (excluding current ${content_item_id}). nextContentItemId will be null.`);
      }
    }

    // 6. Create quiz completion status
    const quizCompletionStatus = !practice_mode ? {
      status: correct && newMastery >= 0.75 ? 'topic_mastered' : 'continue',
      message: correct && newMastery >= 0.75 ? 
        'Great job! You have mastered this topic!' : 
        'Keep practicing! You\'re getting better!',
      masteryAchieved: correct && newMastery >= 0.75,
      currentMastery: newMastery,
      masteryThreshold: 0.75,
      showKCRecommendations: !(correct && newMastery >= 0.75)
    } : null;

    // 7. Send response
    res.status(201).json({
      message: practice_mode ? 'Practice response recorded' : 'Response processed successfully',
      responseId: responseRecord.id,
      newMastery: practice_mode ? null : newMastery,
      nextContentItemId: nextContentItemId,
      quizCompletionStatus: quizCompletionStatus,
      practice_mode: practice_mode || false
    });

  } catch (error) {
    console.error('Error processing response:', error);
    res.status(500).json({ error: 'Failed to process response' });
  }
};

// Update student engagement metrics
exports.updateEngagementMetrics = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      console.warn('[updateEngagementMetrics] Invalid student ID:', req.params.id);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Student ID' 
      });
    }

    // Validate required fields
    const { sessionId, timeOnTask, helpRequests, disengagementIndicators } = req.body;
    if (!sessionId || typeof timeOnTask !== 'number') {
      console.warn('[updateEngagementMetrics] Missing required fields:', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Ensure student exists
    const student = await db.Student.findByPk(studentId);
    if (!student) {
      console.warn('[updateEngagementMetrics] Student not found:', studentId);
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    // Create engagement metric
    const newMetric = await db.EngagementMetric.create({
      student_id: studentId,
      session_id: sessionId,
      time_on_task: timeOnTask,
      help_requests: helpRequests || 0,
      disengagement_indicators: disengagementIndicators || {}
    });

    console.log('[updateEngagementMetrics] Created new metric:', {
      id: newMetric.id,
      studentId,
      sessionId
    });

    res.status(201).json({ 
      success: true, 
      metricsId: newMetric.id,
      message: 'Engagement metrics updated successfully'
    });
  } catch (error) {
    console.error("[updateEngagementMetrics] Error:", {
      message: error.message,
      stack: error.stack,
      studentId: req.params.id
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update engagement metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get top struggling KCs for a student
exports.getStrugglingKCs = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });

    // Get all knowledge states for this student
    const knowledgeStates = await db.KnowledgeState.findAll({
      where: { student_id: studentId },
      include: [{
        model: db.KnowledgeComponent,
        attributes: ['id', 'name', 'description', 'curriculum_code']
      }],
      order: [['p_mastery', 'ASC']], // Order by mastery (lowest first)
      limit: 3 // Get top 3 struggling KCs
    });

    // For each KC, find a relevant practice activity
    const strugglingKCs = await Promise.all(knowledgeStates.map(async (state) => {
      // Find a practice content item for this KC
      const practiceContent = await db.ContentItem.findOne({
        where: {
          knowledge_component_id: state.knowledge_component_id,
          type: { [db.Sequelize.Op.in]: ['question', 'multiple_choice', 'fill_in_blank'] }
        },
        order: db.Sequelize.literal('RANDOM()') // Get a random practice item
      });

      return {
        id: state.knowledge_component_id,
        name: state.KnowledgeComponent.name,
        description: state.KnowledgeComponent.description,
        mastery: state.p_mastery,
        practiceContentId: practiceContent ? practiceContent.id : null
      };
    }));

    res.json(strugglingKCs);
  } catch (error) {
    console.error("Error fetching struggling KCs:", error);
    res.status(500).json({ error: 'Failed to fetch struggling KCs' });
  }
};

// Get student learning path (or generate if none exists)
exports.getLearningPath = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });

    let learningPath = await db.LearningPath.findOne({
      where: { student_id: studentId, status: 'active' } // Assuming only one active path
    });

    if (!learningPath) {
      // If no active path, try generating one
      console.log(`No active learning path found for student ${studentId}, generating new one.`);
      learningPath = await generateAndSaveLearningPath(studentId); // Use helper function
      if (!learningPath) {
         // Handle case where generation fails (e.g., no KCs available for grade)
         console.warn(`Could not generate learning path for student ${studentId} (likely no KCs for grade). Returning empty path.`);
         // Return an empty structure that the frontend might expect
         return res.json({ student_id: studentId, sequence: [], status: 'inactive', message: 'No learning path available for this grade level yet.' });
      }
    }

    res.json(learningPath);
  } catch (error) {
    console.error("Error getting/generating learning path:", error);
    res.status(500).json({ error: 'Failed to get or generate learning path' });
  }
};

// Helper function to generate and save a learning path (basic example)
// TODO: Implement more sophisticated path generation logic based on curriculum, prerequisites, mastery
async function generateAndSaveLearningPath(studentId) {
  try {
     // 1. Get student's current grade level (assuming it's set)
     const student = await db.Student.findByPk(studentId, { attributes: ['grade_level'] });
     if (!student || !student.grade_level) {
        console.error(`Cannot generate path: Student ${studentId} not found or grade level missing.`);
        return null; // Or throw error
     }

     // 2. Find all KCs for the student's grade level (or maybe starting KCs)
     // TODO: Add logic to filter out already mastered KCs based on KnowledgeState p_mastery > threshold
     const kcs = await db.KnowledgeComponent.findAll({
        where: { grade_level: student.grade_level }, // Simple filter by grade
        order: [['id', 'ASC']] // Basic ordering, replace with curriculum order if available
     });

     if (!kcs || kcs.length === 0) {
        console.error(`No knowledge components found for grade ${student.grade_level}.`);
        return null;
     }

     // 3. Create a simple sequence (array of KC IDs)
     const sequence = kcs.map(kc => ({
        knowledge_component_id: kc.id,
        status: 'pending' // Initial status
     }));

     // 4. Deactivate any existing paths (optional, depends on requirements)
     await db.LearningPath.update({ status: 'inactive' }, { where: { student_id: studentId } });

     // 5. Create and save the new path
     const newPath = await db.LearningPath.create({
        student_id: studentId,
        sequence: sequence, // Sequelize handles JSON stringification
        status: 'active'
     });

     return newPath;

  } catch (error) {
     console.error(`Error generating learning path for student ${studentId}:`, error);
     // Re-throw or return null depending on how the caller handles it
     throw error; // Or return null;
  }
}

// Generate a new learning path for a student (API endpoint)
exports.generateLearningPath = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });

    const path = await generateAndSaveLearningPath(studentId); // Use helper
     if (!path) {
         // Handle case where generation fails (e.g., no KCs available for grade)
         return res.status(404).json({ error: 'Could not generate learning path (e.g., no KCs found for grade level).' });
     }
    res.status(201).json(path);
  } catch (error) {
    // Error already logged in helper function
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
};

// Get next recommended content for a student (basic example)
// TODO: Implement more sophisticated recommendation logic
exports.getNextRecommendedContent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });

    // Ensure the authenticated user is requesting their own content or is a teacher
    const authUserId = req.user.id;
    const authUserRole = req.user.role;
    
    if (authUserRole === 'student' && authUserId !== studentId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own content.' });
    }

    try {
      // 1. Get the active learning path
      const learningPath = await db.LearningPath.findOne({
        where: { student_id: studentId, status: 'active' }
      });

      // If path generation failed previously, learningPath might be null or have empty sequence
      if (!learningPath || !learningPath.sequence || learningPath.sequence.length === 0) {
         console.log(`No active/valid learning path found for student ${studentId} when recommending content.`);
         
         // Try to generate a new learning path
         try {
           const newPath = await generateAndSaveLearningPath(studentId);
           if (!newPath || !newPath.sequence || newPath.sequence.length === 0) {
             return res.json({ message: 'Could not create a learning path. Please contact your teacher.' });
           }
           
           // If we successfully created a path, continue with the new path
           const firstKcItem = newPath.sequence[0];
           const firstKcId = firstKcItem.knowledge_component_id;
           
           // Find content for this KC
           const contentItem = await db.ContentItem.findOne({
             where: { knowledge_component_id: firstKcId },
             // Explicitly select only needed attributes
             include: [{ model: db.KnowledgeComponent, attributes: ['id', 'name', 'curriculum_code'] }]
           });
           
           if (!contentItem) {
             return res.json({ message: 'No content available for your new learning path yet.' });
           }
           
           // Create initial knowledge state
           const knowledgeState = await db.KnowledgeState.findOne({
             where: { student_id: studentId, knowledge_component_id: firstKcId }
           }) || await db.KnowledgeState.create({
             student_id: studentId,
             knowledge_component_id: firstKcId,
             p_mastery: 0.3,
             p_transit: 0.09,
             p_guess: 0.2,
             p_slip: 0.1
           });
           
           // Return the data
           return res.json({
             knowledgeComponent: contentItem.KnowledgeComponent.toJSON(),
             knowledgeState: knowledgeState.toJSON(),
             content: {
               lessons: contentItem.type === 'lesson' ? [contentItem.toJSON()] : [],
               questions: ['question', 'multiple_choice', 'fill_in_blank'].includes(contentItem.type) ? [contentItem.toJSON()] : []
             },
             adaptiveRecommendations: {
               recommendations: {
                 difficulty: "Starting with basics",
                 hints: "Available when needed"
               }
             }
           });
         } catch (pathGenError) {
           console.error(`Error generating path for student ${studentId}:`, pathGenError);
           return res.json({ message: 'No learning path available to recommend content.' });
         }
      }

      // 2. Find the first 'pending' KC in the sequence
      const nextKcItem = learningPath.sequence.find(item => item.status === 'pending');

      if (!nextKcItem) {
        // Path completed or no pending items left
        return res.json({ message: 'Learning path complete! Please ask your teacher for a new path.' });
      }

      const nextKcId = nextKcItem.knowledge_component_id;

      // Get a single next recommended activity for kid-friendly dashboard
      exports.getKidFriendlyNextActivity = async (req, res) => {
        try {
          const studentId = parseInt(req.params.id, 10);
          if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });
      
          // Get student to check grade level
          const student = await db.Student.findByPk(studentId);
          if (!student) {
            return res.status(404).json({ error: 'Student not found' });
          }
      
          // Get the student's knowledge states
          const knowledgeStates = await db.KnowledgeState.findAll({
            where: { student_id: studentId },
            include: [{ model: db.KnowledgeComponent, attributes: ['id', 'name', 'curriculum_code', 'grade_level'] }]
          });
          
          // Find the KC with the lowest mastery that matches the student's grade level
          let lowestMasteryKC = null;
          let lowestMastery = 1.0;
          
          for (const state of knowledgeStates) {
            if (state.KnowledgeComponent &&
                state.KnowledgeComponent.grade_level === student.grade_level &&
                state.p_mastery < lowestMastery) {
              lowestMastery = state.p_mastery;
              lowestMasteryKC = state.KnowledgeComponent;
            }
          }
          
          // If no KC found with low mastery, get any KC from the student's grade
          if (!lowestMasteryKC) {
            // Get first KC from their grade level if none found
            const gradeKCs = await db.KnowledgeComponent.findAll({
              where: { grade_level: student.grade_level },
              limit: 1
            });
            
            if (gradeKCs && gradeKCs.length > 0) {
              lowestMasteryKC = gradeKCs[0];
            } else {
              // Fall back to any KC if no match for grade level
              const anyKC = await db.KnowledgeComponent.findOne();
              if (anyKC) {
                lowestMasteryKC = anyKC;
              } else {
                return res.status(404).json({ error: 'No knowledge components available' });
              }
            }
          }
          
          // Find a content item for this KC
          const contentItem = await db.ContentItem.findOne({
            where: { knowledge_component_id: lowestMasteryKC.id },
            attributes: ['id', 'title', 'content', 'type', 'knowledge_component_id'],
          });
          
          if (!contentItem) {
            return res.status(404).json({ error: 'No content available for the recommended knowledge component' });
          }
          
          // Format a kid-friendly response
          const masteryPercentage = Math.round((lowestMastery || 0.1) * 100);
          const kcName = lowestMasteryKC.name;
          
          // Simplify knowledge component name for kids
          let simplifiedName = kcName;
          if (kcName.length > 30) {
            // Extract key concept using simple rules
            if (kcName.includes("Numbers")) {
              simplifiedName = "Working with Numbers";
            } else if (kcName.includes("Addition")) {
              simplifiedName = "Addition";
            } else if (kcName.includes("Subtraction")) {
              simplifiedName = "Subtraction";
            } else if (kcName.includes("Place Value")) {
              simplifiedName = "Place Value";
            } else if (kcName.includes("Rounding")) {
              simplifiedName = "Rounding Numbers";
            } else if (kcName.includes("Comparing")) {
              simplifiedName = "Comparing Numbers";
            } else if (kcName.includes("Money")) {
              simplifiedName = "Money Math";
            } else {
              // Take just the first part if nothing matches
              simplifiedName = kcName.split(" ").slice(0, 3).join(" ");
            }
          }
          
          // Create emoji based on topic
          let topicEmoji = "📝";
          if (simplifiedName.includes("Number")) topicEmoji = "🔢";
          if (simplifiedName.includes("Addition")) topicEmoji = "➕";
          if (simplifiedName.includes("Subtraction")) topicEmoji = "➖";
          if (simplifiedName.includes("Money")) topicEmoji = "💰";
          if (simplifiedName.includes("Place Value")) topicEmoji = "🔣";
          if (simplifiedName.includes("Comparing")) topicEmoji = "⚖️";
          if (simplifiedName.includes("Ordering")) topicEmoji = "📊";
          if (simplifiedName.includes("Rounding")) topicEmoji = "🔄";
          
          // Create response that keeps the necessary IDs but presents information in a kid-friendly way
          res.json({
            id: contentItem.id,
            kc_id: lowestMasteryKC.id,
            name: simplifiedName,
            emoji: topicEmoji,
            mastery: masteryPercentage,
            description: masteryPercentage < 30 ? "Let's learn something new!" :
                        masteryPercentage < 70 ? "Let's practice more!" :
                        "Let's master this!",
            activityType: contentItem.type,
            difficulty: masteryPercentage < 30 ? "easy" :
                       masteryPercentage < 70 ? "medium" : "challenging"
          });
          
        } catch (error) {
          console.error("Error getting kid-friendly activity:", error);
          res.status(500).json({ error: 'Failed to get next activity' });
        }
      };
      
      try {
        // 3. Use the BKT algorithm utility to recommend the next content item
        let contentItem = await recommendNextContent(studentId, nextKcId);

        // If no content item is found by the recommendation logic
        if (!contentItem) {
          console.log(`recommendNextContent returned null for KC ID: ${nextKcId}, student ${studentId}`);
          // Find the name of the KC for the message
          const kc = await db.KnowledgeComponent.findByPk(nextKcId, { attributes: ['name'] });
          const kcName = kc ? kc.name : 'Next Topic';
          return res.json({ message: `Could not find a suitable next practice item for the current topic: ${kcName}. Please check back later or contact your teacher.` });
        }

        // Need to explicitly include the KnowledgeComponent for the response structure
        // Re-fetch the recommended item with the necessary include
        contentItem = await db.ContentItem.findByPk(contentItem.id, {
           include: [{ model: db.KnowledgeComponent, attributes: ['id', 'name', 'curriculum_code'] }]
        });

        // Handle case where re-fetch fails (should be rare)
        if (!contentItem) {
           console.error(`Failed to re-fetch recommended content item ${contentItem.id} with KC details.`);
           return res.status(500).json({ error: 'Internal server error fetching recommendation details.' });
        }

        // If contentItem exists, but somehow the included KC doesn't (shouldn't happen with FK constraints)
        if (!contentItem.KnowledgeComponent) {
            console.error(`Data inconsistency: ContentItem ${contentItem.id} found, but associated KnowledgeComponent ${nextKcId} is missing.`);
            return res.json({ message: 'Data inconsistency detected. Please contact support.' });
        }

        try {
          // 4. Fetch the student's knowledge state for this KC
          let knowledgeState = await db.KnowledgeState.findOne({
            where: { student_id: studentId, knowledge_component_id: nextKcId }
          });

          // If no state exists, create a default one 
          if (!knowledgeState) {
            console.warn(`No knowledge state found for student ${studentId}, KC ${nextKcId}. Creating default.`);
            try {
              knowledgeState = await db.KnowledgeState.create({
                student_id: studentId,
                knowledge_component_id: nextKcId,
                p_mastery: 0.3, // Default initial mastery
                p_transit: 0.09,
                p_guess: 0.2,
                p_slip: 0.1
              });
            } catch (createError) {
              console.error("Error creating knowledge state:", createError);
              // Fallback to a default object if creation fails
              knowledgeState = { 
                student_id: studentId, 
                knowledge_component_id: nextKcId, 
                p_mastery: 0.3,
                p_transit: 0.09,
                p_guess: 0.2,
                p_slip: 0.1,
                last_update: new Date()
              };
            }
          }

          // Calculate adaptive recommendations based on mastery level
          const mastery = knowledgeState.p_mastery || 0.3;
          let difficultyRec, hintsRec;
          
          if (mastery < 0.3) {
            difficultyRec = "Start with easier problems";
            hintsRec = "Provide detailed hints";
          } else if (mastery < 0.6) {
            difficultyRec = "Mix of easy and medium difficulty problems";
            hintsRec = "Provide hints when needed";
          } else if (mastery < 0.8) {
            difficultyRec = "Challenge with harder problems";
            hintsRec = "Minimize hints to build confidence";
          } else {
            difficultyRec = "Advanced problems to master the concept";
            hintsRec = "Minimal hints, encourage independent thinking";
          }

          // 5. Structure the response as expected by the frontend
          const responseData = {
            knowledgeComponent: contentItem.KnowledgeComponent.toJSON(),
            knowledgeState: knowledgeState.toJSON ? knowledgeState.toJSON() : knowledgeState,
            content: {
              lessons: contentItem.type === 'lesson' ? [contentItem.toJSON()] : [], 
              questions: ['question', 'multiple_choice', 'fill_in_blank'].includes(contentItem.type) ? [contentItem.toJSON()] : [] 
            },
            adaptiveRecommendations: {
              recommendations: {
                difficulty: difficultyRec,
                hints: hintsRec
              }
            }
          };

          return res.json(responseData);
        } catch (knowledgeStateError) {
          console.error("Error with knowledge state:", knowledgeStateError);
          // Return partial data even if knowledge state has issues
          return res.json({
            knowledgeComponent: contentItem.KnowledgeComponent.toJSON(),
            message: "Knowledge state data unavailable",
            content: {
              lessons: contentItem.type === 'lesson' ? [contentItem.toJSON()] : [], 
              questions: ['question', 'multiple_choice', 'fill_in_blank'].includes(contentItem.type) ? [contentItem.toJSON()] : [] 
            }
          });
        }
      } catch (contentError) {
        console.error("Error getting content item:", contentError);
        return res.json({ 
          message: 'Content item not available. Please try again later.' 
        });
      }
    } catch (pathError) {
      console.error("Error getting learning path:", pathError);
      return res.json({ 
        message: 'Learning path not available. Generating a new path.' 
      });
    }
  } catch (error) {
    console.error("Error getting next recommended content:", error);
    return res.json({ 
      message: 'Recommendation system temporarily unavailable. Please try again later.' 
    });
  }
};

// Mark a knowledge component as completed in the learning path
exports.completeKnowledgeComponent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const kcIdToComplete = parseInt(req.params.kcId, 10);

    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });
    if (isNaN(kcIdToComplete)) return res.status(400).json({ error: 'Invalid Knowledge Component ID' });

    // 1. Find the active learning path
    const learningPath = await db.LearningPath.findOne({
      where: { student_id: studentId, status: 'active' }
    });

    if (!learningPath || !learningPath.sequence) {
      return res.status(404).json({ error: 'Active learning path not found' });
    }

    // 2. Update the sequence in memory
    let found = false;
    const updatedSequence = learningPath.sequence.map(item => {
      if (item.knowledge_component_id === kcIdToComplete) {
        found = true;
        return { ...item, status: 'completed' }; // Mark as completed
      }
      return item;
    });

    if (!found) {
       console.warn(`KC ID ${kcIdToComplete} not found in active path for student ${studentId}`);
    }

    // 3. Save the updated sequence back to the database
    learningPath.changed('sequence', true); // Mark sequence as changed
    learningPath.sequence = updatedSequence;
    await learningPath.save(); // Save the changes to the instance

    res.json(learningPath); // Return the updated path

  } catch (error) {
    console.error("Error completing knowledge component:", error);
    res.status(500).json({ error: 'Failed to complete knowledge component' });
  }
};

// Get detailed performance for the logged-in student
exports.getOwnDetailedPerformance = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user || !req.user.id) {
      console.error('getOwnDetailedPerformance: No user in request or missing id');
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }

    const studentId = req.user.id; // Get ID from authenticated user token
    console.log(`Getting detailed performance for student ID: ${studentId}`);
      // Find the student record first to verify existence
      const student = await db.Student.findByPk(studentId);
      
      if (!student) {
        console.error(`Student with ID ${studentId} not found in database`);
        return res.status(404).json({ error: 'Student data not found for authenticated user.' });
      }
      
      // Get knowledge states with error handling
      let knowledgeStatesRaw = [];
      let knowledgeComponentsMap = {};
      try {
        // Fetch only KnowledgeState data first
        knowledgeStatesRaw = await db.KnowledgeState.findAll({
          where: { student_id: studentId },
          attributes: ['id', 'student_id', 'knowledge_component_id', 'p_mastery', 'p_transit', 'p_guess', 'p_slip', 'createdAt', 'updatedAt'],
          raw: true
        });

        // Get unique KC IDs
        const kcIds = [...new Set(knowledgeStatesRaw.map(s => s.knowledge_component_id))];

        // Fetch associated KnowledgeComponent details separately
        const knowledgeComponents = await db.KnowledgeComponent.findAll({
          where: { id: kcIds },
          attributes: ['id', 'name', 'curriculum_code'],
          raw: true
        });
        
        // Create a map for easy lookup
        knowledgeComponentsMap = knowledgeComponents.reduce((map, kc) => {
          map[kc.id] = kc;
          return map;
        }, {});

      } catch (ksError) {
        console.error('Error fetching knowledge states or components:', ksError);
        // Continue with empty arrays/maps
      }
      
      // Combine the data later when needed (e.g., for the final response object)
      // We'll use knowledgeStatesRaw and knowledgeComponentsMap directly in calculations first
      
      // Get responses with error handling
      let responses = [];
      try {
        responses = await db.Response.findAll({
          where: { student_id: studentId },
          include: [{ // Keep include for ContentItem
            model: db.ContentItem,
            // Remove nested include for KnowledgeComponent here
            attributes: ['id', 'knowledge_component_id', 'type', 'difficulty', 'content'] // Ensure 'id' is included if needed elsewhere
          }],
          order: [['createdAt', 'DESC']],
          limit: 20 // Keep limit for recent responses
        });
      } catch (respError) {
        console.error('Error fetching responses:', respError);
        // Continue with empty array
      }
      
      // Get learning path with error handling
      let learningPath = null;
      try {
        learningPath = await db.LearningPath.findOne({ 
          where: { student_id: studentId, status: 'active' } 
        });
      } catch (lpError) {
        console.error('Error fetching learning path:', lpError);
        // Continue with null
      }
      
      // Get engagement metrics with error handling
      let engagementMetrics = [];
      try {
        engagementMetrics = await db.EngagementMetric.findAll({ 
          where: { student_id: studentId }, 
          order: [['createdAt', 'DESC']] 
        });
      } catch (emError) {
        console.error('Error fetching engagement metrics:', emError);
        // Continue with empty array
      }

      // Calculate performance metrics by knowledge component
      const performanceByKC = {};
      responses.forEach(response => {
        // Safety check for response structure
        // Enhanced safety check: Ensure ContentItem exists and has a KC ID
        if (!response || !response.ContentItem || !response.ContentItem.knowledge_component_id) {
          console.warn(`Skipping response ID ${response?.id || 'unknown'} in performance calculation due to missing ContentItem or KC ID.`);
          return; // Skip this iteration
        }
        
        // Extract KC ID
        const kcId = response.ContentItem.knowledge_component_id;
        // We will get kcName and kcCode later using the knowledgeComponentsMap
        console.log(`[getOwnDetailedPerformance] Processing response for KC ID: ${kcId}`); // Add log here
        
        if (!performanceByKC[kcId]) {
          // Initialize without name/code, they will be added later from the map
          performanceByKC[kcId] = {
            totalResponses: 0,
            correctResponses: 0,
            totalTime: 0,
            mastery: 0
          };
          // Use the raw states data
          const state = knowledgeStatesRaw.find(s => s.knowledge_component_id === kcId);
          if (state) {
            performanceByKC[kcId].mastery = state.p_mastery;
          }
          // Get KC name/code from the map
          const kcDetails = knowledgeComponentsMap[kcId];
          performanceByKC[kcId].name = kcDetails?.name || 'Unknown Topic';
          performanceByKC[kcId].curriculum_code = kcDetails?.curriculum_code || 'UNKNOWN';
        }
        
        performanceByKC[kcId].totalResponses++;
        if (response.correct === true) {
          performanceByKC[kcId].correctResponses++;
        }
        performanceByKC[kcId].totalTime += (response.time_spent || 0);
      });

    // Calculate averages for KC performance
    Object.values(performanceByKC).forEach(kc => {
      kc.correctRate = kc.totalResponses > 0 ? kc.correctResponses / kc.totalResponses : 0;
      kc.averageTime = kc.totalResponses > 0 ? kc.totalTime / kc.totalResponses : 0;
    });

    // Calculate overall metrics
    // Use raw states data for calculation
    const totalMastery = knowledgeStatesRaw.reduce((sum, state) => sum + state.p_mastery, 0);
    const averageMastery = knowledgeStatesRaw.length > 0 ? totalMastery / knowledgeStatesRaw.length : 0;
    const totalRecentResponses = responses.length;
    const correctRecentResponses = responses.filter(r => r.correct === true).length;
    const overallCorrectRate = totalRecentResponses > 0 ? correctRecentResponses / totalRecentResponses : 0;

    // Placeholder for fuzzy logic recommendations
    const latestEngagementMetric = engagementMetrics.length > 0 ? engagementMetrics[0] : null;
    const engagementScore = 0.5; // Placeholder
    const adaptiveRecommendations = { teacherAlert: 0.5, teacherAlertLabel: 'Medium', recommendations: ['Review recent activity'] };

    // Prepare response
    const detailedPerformance = {
      student: student.toJSON(),
      // Convert arrays of Sequelize instances to plain JSON
      // Reconstruct knowledgeStates with embedded KC details for the response
      knowledgeStates: knowledgeStatesRaw.map(state => ({
        ...state,
        KnowledgeComponent: knowledgeComponentsMap[state.knowledge_component_id] || null
      })),
      performanceByKC, // Already a plain object
      // Convert array of potentially nested Sequelize instances
      recentResponses: responses.map(r => r.toJSON()),
      // Convert single instance (or null) to plain JSON
      learningPath: learningPath ? learningPath.toJSON() : null,
      // Convert array of Sequelize instances to plain JSON
      engagementMetrics: engagementMetrics.map(em => em.toJSON()),
      overallMetrics: {
        averageMastery,
        engagement: engagementScore, 
        totalResponses: totalRecentResponses,
        correctRate: overallCorrectRate
      },
      interventionRecommendations: {
        needed: adaptiveRecommendations.teacherAlert > 0.6,
        priority: adaptiveRecommendations.teacherAlertLabel,
        recommendations: adaptiveRecommendations.recommendations
      }
    };

    res.json(detailedPerformance);
  } catch (error) {
     // Log the full error object for detailed diagnosis
     console.error("Detailed error in getOwnDetailedPerformance:", error);
     // Also log specific parts if available, like stack trace
     console.error("Stack trace:", error.stack);
     // Send a generic error message, but log the details server-side
    res.status(500).json({ error: 'Failed to fetch student detailed performance. Check server logs for details.' });
  }
};

// Get detailed performance for a specific student ID (e.g., for parent/teacher view)
exports.getDetailedPerformanceById = async (req, res) => {
  console.log(`[getDetailedPerformanceById] Received request for student ID: ${req.params.id}`); // Log the received ID
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }

    // TODO: Implement proper authorization check here.
    // Ensure the requesting user (req.user) is allowed to view this student's data.
    // e.g., check if req.user.role is 'parent' and linked via ParentStudent,
    // or if req.user.role is 'teacher' and linked via ClassroomStudent.
    // For now, relying on optionalAuth for basic token check.

    // --- Fetch Data (Similar to getOwnDetailedPerformance but using studentId from params) ---

    // 1. Fetch Student Info (excluding password)
    const student = await db.Student.findByPk(studentId, {
      attributes: { exclude: ['password'] }
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // 1.5 Fetch Learning Path (active)
    let learningPath = null;
    try {
      learningPath = await db.LearningPath.findOne({
        where: { student_id: studentId, status: 'active' }
      });
      
      // If learning path is found, fetch additional details for each component in the sequence
      if (learningPath && learningPath.sequence && learningPath.sequence.length > 0) {
        // Get all KC IDs from the sequence
        const kcIds = learningPath.sequence.map(item => item.knowledge_component_id);
        
        // Fetch details for all KCs in a single query
        const kcDetails = await db.KnowledgeComponent.findAll({
          where: { id: kcIds },
          attributes: ['id', 'name', 'curriculum_code']
        });
        
        // Create a lookup map for quick access
        const kcMap = kcDetails.reduce((map, kc) => {
          map[kc.id] = kc;
          return map;
        }, {});
        
        // Enhance each item in the sequence with KC details
        learningPath.sequence = learningPath.sequence.map(item => {
          const kc = kcMap[item.knowledge_component_id];
          return {
            ...item,
            name: kc ? kc.name : 'Unknown Component',
            curriculum_code: kc ? kc.curriculum_code : 'unknown'
          };
        });
      }
    } catch (lpError) {
      console.error(`Error fetching learning path for student ${studentId}:`, lpError);
      // Continue with null learning path
    }

    // 2. Fetch Knowledge States with Component Names
    let knowledgeStatesRaw = [];
    let knowledgeComponentsMap = {};
    try {
        knowledgeStatesRaw = await db.KnowledgeState.findAll({
            where: { student_id: studentId },
            attributes: ['id', 'student_id', 'knowledge_component_id', 'p_mastery', 'p_transit', 'p_guess', 'p_slip', 'createdAt', 'updatedAt'],
            raw: true
        });
        const kcIds = [...new Set(knowledgeStatesRaw.map(s => s.knowledge_component_id))];
        if (kcIds.length > 0) {
            const knowledgeComponents = await db.KnowledgeComponent.findAll({
                where: { id: kcIds },
                attributes: ['id', 'name', 'curriculum_code'],
                raw: true
            });
            knowledgeComponentsMap = knowledgeComponents.reduce((map, kc) => {
                map[kc.id] = kc;
                return map;
            }, {});
        }
    } catch (ksError) {
        console.error(`Error fetching knowledge states for student ${studentId}:`, ksError);
        // Continue, but knowledge states might be empty
    }
     const knowledgeStates = knowledgeStatesRaw.map(state => ({
        ...state,
        KnowledgeComponent: knowledgeComponentsMap[state.knowledge_component_id] || null
    }));


    // 3. Fetch Recent Responses (e.g., last 20) with Content Item details
    let recentResponses = [];
    try {
        recentResponses = await db.Response.findAll({
            where: { student_id: studentId },
            limit: 20,
            order: [['createdAt', 'DESC']],
            include: [{
                model: db.ContentItem,
                attributes: ['id', 'content', 'type', 'knowledge_component_id', 'difficulty'] // Add difficulty field
            }],
            attributes: ['id', 'answer', 'correct', 'time_spent', 'createdAt'] // Select specific fields
        });
        
        console.log(`Found ${recentResponses.length} recent responses for student ${studentId}`);
        
        // Convert to JSON and add more details for each response
        recentResponses = recentResponses.map(r => {
            // Use proper JSON conversion for nested objects
            const responseJson = r.toJSON ? r.toJSON() : JSON.parse(JSON.stringify(r));
            
            // Log the response structure to debug
            console.log(`Response ID ${responseJson.id} - Has ContentItem: ${!!responseJson.ContentItem}`);
            
            // Ensure ContentItem exists
            if (responseJson.ContentItem && responseJson.ContentItem.knowledge_component_id) {
                // Add KC name to response
                responseJson.knowledge_component_name = knowledgeComponentsMap[responseJson.ContentItem.knowledge_component_id]?.name || 'Unknown KC';
                
                // Make sure difficulty is set (default to 3 if not present)
                if (responseJson.ContentItem.difficulty === undefined || responseJson.ContentItem.difficulty === null) {
                    responseJson.ContentItem.difficulty = 3;
                }
            } else {
                responseJson.knowledge_component_name = 'Unknown KC';
                // Create ContentItem if it's missing
                responseJson.ContentItem = {
                    id: null,
                    content: 'Content not available',
                    type: 'unknown',
                    knowledge_component_id: null,
                    difficulty: 3
                };
            }
            
            // Ensure time_spent has a default
            if (responseJson.time_spent === undefined || responseJson.time_spent === null) {
                responseJson.time_spent = 1000; // Default 1 second
            }
            
            return responseJson;
        });
    } catch (respError) {
        console.error(`Error fetching responses for student ${studentId}:`, respError);
        // Continue, but responses might be empty
    }

    // --- Calculate performance metrics by knowledge component ---
    const performanceByKC = {}; // Initialize the object
    recentResponses.forEach(response => {
      // Safety check for response structure
      if (!response || !response.ContentItem || !response.ContentItem.knowledge_component_id) {
        console.warn(`Skipping response ID ${response?.id || 'unknown'} in performance calculation due to missing ContentItem or KC ID.`);
        return; // Skip this iteration
      }
      
      // Extract KC ID
      const kcId = response.ContentItem.knowledge_component_id;
      
      if (!performanceByKC[kcId]) {
        // Initialize without name/code, they will be added later from the map
        performanceByKC[kcId] = {
          totalResponses: 0,
          correctResponses: 0,
          totalTime: 0,
          mastery: 0
        };
        // Use the raw states data
        const state = knowledgeStatesRaw.find(s => s.knowledge_component_id === kcId);
        if (state) {
          performanceByKC[kcId].mastery = state.p_mastery;
        }
        // Get KC name/code from the map
        const kcDetails = knowledgeComponentsMap[kcId];
        performanceByKC[kcId].name = kcDetails?.name || 'Unknown Topic';
        performanceByKC[kcId].curriculum_code = kcDetails?.curriculum_code || 'UNKNOWN';
      }
      
      performanceByKC[kcId].totalResponses++;
      if (response.correct === true) {
        performanceByKC[kcId].correctResponses++;
      }
      performanceByKC[kcId].totalTime += (response.time_spent || 0);
    });

    // Calculate averages for KC performance
    Object.values(performanceByKC).forEach(kc => {
      kc.correctRate = kc.totalResponses > 0 ? kc.correctResponses / kc.totalResponses : 0;
      kc.averageTime = kc.totalResponses > 0 ? kc.totalTime / kc.totalResponses : 0;
    });
    // --- End Calculate performance metrics ---

    // 4. Fetch Engagement Metrics (e.g., last 7 days)
    let engagementMetrics = [];
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        engagementMetrics = await db.EngagementMetric.findAll({
            where: {
                student_id: studentId,
                createdAt: { [db.Sequelize.Op.gte]: sevenDaysAgo } // Use createdAt instead of timestamp
            },
            order: [['createdAt', 'DESC']] // Use createdAt instead of timestamp
        });
    } catch (engError) {
        console.error(`Error fetching engagement metrics for student ${studentId}:`, engError);
        // Continue, but engagement might be empty
    }

    // 5. Aggregate Overall Metrics (Example)
    const totalKcs = knowledgeStates.length;
    const masteredKcs = knowledgeStates.filter(ks => ks.p_mastery >= 0.85).length; // Example threshold
    const averageMastery = totalKcs > 0 ? (knowledgeStates.reduce((sum, ks) => sum + ks.p_mastery, 0) / totalKcs) : 0;
    const recentCorrectCount = recentResponses.filter(r => r.correct).length;
    const recentAccuracy = recentResponses.length > 0 ? (recentCorrectCount / recentResponses.length) : 0;

    // --- Construct Response ---
    const detailedPerformance = {
      studentInfo: student.toJSON(), // Send student profile info
      knowledgeStates: knowledgeStates, // Send detailed states with KC info
      recentResponses: recentResponses, // Send recent responses with KC names
      engagementMetrics: engagementMetrics, // Send recent engagement
      performanceByKC: performanceByKC, // Add the missing performance data by KC
      learningPath: learningPath ? learningPath.toJSON() : null, // Add learning path data
      overallMetrics: {
        totalKnowledgeComponents: totalKcs,
        masteredKnowledgeComponents: masteredKcs,
        averageMastery: averageMastery,
        recentAccuracy: recentAccuracy,
        // Add more aggregated metrics as needed
      },
      // Add intervention recommendations if logic exists
      interventionRecommendations: {
         needed: true, // Enable intervention recommendations UI
         priority: 'Medium', // Priority level (Low, Medium, High)
         recommendations: {
           difficulty: "Reduce difficulty level for fraction problems",
           hints: "Provide more detailed hints for division problems",
           pacing: "Slow down the progression through new topics"
         },
         // Example: Add logic here based on low mastery KCs or error patterns
         areasForFocus: knowledgeStates.filter(ks => ks.p_mastery < 0.5)
                                     .map(ks => ks.KnowledgeComponent?.name || `KC ID: ${ks.knowledge_component_id}`)
                                     .slice(0, 3), // Limit recommendations
         suggestedActivities: [] // Add logic to suggest activities
      }
    };

    res.json(detailedPerformance);

  } catch (error) {
    console.error(`Error fetching detailed performance for student ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch detailed performance data' });
  }
};

// Get consolidated data for the student dashboard (Modules, KCs, Mastery)
exports.getDashboardData = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid Student ID' });

    // Optional: Add authentication check if needed
    // const authUserId = req.user.id;
    // if (req.user.role === 'student' && authUserId !== studentId) {
    //   return res.status(403).json({ error: 'Forbidden: You can only access your own dashboard.' });
    // }

    // 1. Fetch student's grade level to filter KCs (optional but recommended)
    const student = await db.Student.findByPk(studentId, { attributes: ['grade_level'] });
    const gradeLevel = student?.grade_level; // Use student's grade or null

    // 2. Fetch relevant Knowledge Components
    const whereClause = gradeLevel ? { grade_level: gradeLevel } : {}; // Filter by grade if available
    const knowledgeComponents = await db.KnowledgeComponent.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'description', 'curriculum_code', 'grade_level'], // Include necessary fields
      order: [['curriculum_code', 'ASC'], ['name', 'ASC']] // Order for consistent module grouping
    });

    if (!knowledgeComponents || knowledgeComponents.length === 0) {
      return res.json({ modules: [] }); // Return empty if no KCs found
    }

    // 3. Fetch student's Knowledge States for these KCs
    const kcIds = knowledgeComponents.map(kc => kc.id);
    const knowledgeStates = await db.KnowledgeState.findAll({
      where: {
        student_id: studentId,
        knowledge_component_id: { [db.Sequelize.Op.in]: kcIds }
      },
      attributes: ['knowledge_component_id', 'p_mastery']
    });

    // Create a map for quick lookup: kcId -> mastery
    const masteryMap = knowledgeStates.reduce((map, state) => {
      map[state.knowledge_component_id] = state.p_mastery;
      return map;
    }, {});

    // 4. Group KCs by Module based on curriculum_code (e.g., G3-M1-...)
    const modulesMap = {};
    const moduleNameMap = { // Simple mapping for module names - Updated based on user feedback
        'M1': 'Module 1: Numero At Ang Kahulugan Nito',
        'M2': 'Module 2: Numero At Ang Kahulugan Nito',
        'M3': 'Module 3: Numero At Ang Kahulugan Nito'
        // Add more mappings as needed for M4, M5 etc. if KCs exist for them
    };

    knowledgeComponents.forEach(kc => {
      // Extract module identifier (e.g., "M1" from "G3-M1-KC1-...")
      const codeParts = kc.curriculum_code?.split('-');
      const moduleId = codeParts && codeParts.length >= 2 ? codeParts[1] : 'UNKNOWN'; // Default if format is unexpected

      if (!modulesMap[moduleId]) {
        modulesMap[moduleId] = {
          id: moduleId,
          name: moduleNameMap[moduleId] || `Module ${moduleId}`, // Use mapped name or default
          knowledgeComponents: []
        };
      }

      modulesMap[moduleId].knowledgeComponents.push({
        id: kc.id,
        name: kc.name,
        description: kc.description,
        curriculum_code: kc.curriculum_code,
        mastery: masteryMap[kc.id] ?? 0 // Changed from 0.3 to 0 for new students
      });
    });

    // Convert map to array
    const modulesArray = Object.values(modulesMap);

    res.json({ modules: modulesArray });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Update student intervention settings
exports.updateInterventionSettings = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { type, value } = req.body;

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }

    // Verify student exists
    const student = await db.Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update intervention settings based on type
    switch (type) {
      case 'difficulty':
        // Validate difficulty value (1-5)
        if (!value || value < 1 || value > 5) {
          return res.status(400).json({ error: 'Invalid difficulty value. Must be between 1 and 5.' });
        }
        
        // Update student's difficulty setting
        await student.update({
          intervention_settings: {
            ...student.intervention_settings,
            difficulty: value
          }
        });
        break;

      case 'hints':
        // Validate hint level
        const validHintLevels = ['detailed', 'strategic', 'minimal'];
        if (!validHintLevels.includes(value)) {
          return res.status(400).json({ error: 'Invalid hint level' });
        }
        
        // Update student's hint setting
        await student.update({
          intervention_settings: {
            ...student.intervention_settings,
            hints: value
          }
        });
        break;

      case 'pacing':
        // Validate pacing level
        const validPaceLevels = ['extended', 'regular', 'accelerated'];
        if (!validPaceLevels.includes(value)) {
          return res.status(400).json({ error: 'Invalid pacing level' });
        }
        
        // Update student's pacing setting
        await student.update({
          intervention_settings: {
            ...student.intervention_settings,
            pacing: value
          }
        });
        break;

      case 'focus':
        // Update student's focus area
        await student.update({
          intervention_settings: {
            ...student.intervention_settings,
            focus: value
          }
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid intervention setting type' });
    }

    res.json({ 
      success: true, 
      message: 'Intervention settings updated successfully',
      settings: student.intervention_settings
    });

  } catch (error) {
    console.error('Error updating intervention settings:', error);
    res.status(500).json({ error: 'Failed to update intervention settings' });
  }
};

// Get student progress data including streak and daily exercises
exports.getStudentProgress = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }

    // Get student data first
    const student = await db.Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get student's exercise history using the correct model name
    const exerciseHistory = await db.Response.findAll({
      where: {
        student_id: studentId
      },
      attributes: ['createdAt', 'content_item_id'],
      order: [['createdAt', 'DESC']],
      include: [{
        model: db.ContentItem,
        attributes: ['knowledge_component_id']
      }]
    });

    // Calculate streak
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < exerciseHistory.length; i++) {
      const responseDate = new Date(exerciseHistory[i].createdAt);
      responseDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        // Check if the last activity was today or yesterday
        const diffDays = Math.floor((currentDate - responseDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          break; // Streak broken
        }
        streak = 1;
      } else {
        const prevResponseDate = new Date(exerciseHistory[i - 1].createdAt);
        prevResponseDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((prevResponseDate - responseDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break; // Streak broken
        }
      }
    }

    // Count today's completed topics/quizzes
    const todayResponses = exerciseHistory.filter(response => {
      const responseDate = new Date(response.createdAt).toISOString().split('T')[0];
      return responseDate === today;
    });

    // Group responses by knowledge component to count completed topics
    const completedTopics = new Set();
    todayResponses.forEach(response => {
      if (response.ContentItem && response.ContentItem.knowledge_component_id) {
        completedTopics.add(response.ContentItem.knowledge_component_id);
      }
    });

    // Get total available topics for today
    const totalTopics = await db.KnowledgeComponent.count({
      where: {
        grade_level: student.grade_level
      }
    });

    res.json({
      streak,
      topicsCompleted: completedTopics.size,
      totalTopics,
      lastActivity: exerciseHistory[0]?.createdAt || null
    });

  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
};

// Get knowledge components for the student's grade level
exports.getStudentKnowledgeComponents = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    
    // Validate student ID
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }
    
    // Check if this is the authenticated student or has permission
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'You can only access your own knowledge components' });
    }
    
    // Get the student's grade level
    const student = await db.Student.findByPk(studentId, { attributes: ['grade_level'] });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get knowledge components for this grade level
    const knowledgeComponents = await db.KnowledgeComponent.findAll({
      where: { grade_level: student.grade_level },
      order: [['curriculum_code', 'ASC'], ['name', 'ASC']]
    });
    
    res.json(knowledgeComponents);
  } catch (error) {
    console.error('Error fetching student knowledge components:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge components' });
  }
};
