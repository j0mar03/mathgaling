/**
 * Content Controller
 *
 * This controller handles API routes related to fetching content items
 * and knowledge components.
 */

const db = require('../models'); // Import Sequelize db object

// Get specific content item
exports.getContentItem = async (req, res) => {
  try {
    const { contentId } = req.params;
    console.log(`Fetching content item with ID: ${contentId}`);
    
    // Try to parse contentId as integer, but handle if it's already an integer
    const id = isNaN(contentId) ? parseInt(contentId, 10) : contentId;
    
    // Check if we have a valid ID
    if (isNaN(id)) {
      console.error(`Invalid content ID format: ${contentId}`);
      return res.status(400).json({ error: 'Invalid content item ID format' });
    }
    
    // Try to fetch the content item with its associated KnowledgeComponent
    const content = await db.ContentItem.findByPk(id, {
      include: [{
        model: db.KnowledgeComponent,
        attributes: ['id', 'name', 'curriculum_code']
      }]
    });

    // --- DEBUG LOGGING ---
    console.log(`[contentController] Fetched content for ID ${id}.`);
    if (content) {
        console.log(`[contentController] Content item found with KC:`, content.KnowledgeComponent);
        // Log the type and value of metadata *after* fetching from DB
        console.log(`[contentController] Metadata type: ${typeof content.metadata}`);
        console.log(`[contentController] Metadata value:`, content.metadata);
        // Check specifically for the hint property if metadata is an object
        if (typeof content.metadata === 'object' && content.metadata !== null) {
             console.log(`[contentController] Hint value in metadata:`, content.metadata.hint);
        }
    }
    // --- END DEBUG LOGGING ---

    // Handle case where content is not found
    if (!content) {
      console.error(`Content item with ID ${id} not found`);
      return res.status(404).json({ error: 'Content item not found' });
    }
    
    // Add additional information for the client if needed
    // For example, we might want to check knowledge state if a student ID is provided
    if (req.user && req.user.role === 'student') {
      try {
        // Try to get the knowledge state for this content item's knowledge component
        const kcId = content.knowledge_component_id;
        if (kcId) {
          const knowledgeState = await db.KnowledgeState.findOne({
            where: { 
              student_id: req.user.id,
              knowledge_component_id: kcId
            }
          });
          
          if (knowledgeState) {
            // Add the knowledge state to the response
            const contentWithState = content.toJSON();
            contentWithState.knowledgeState = knowledgeState;
            return res.json(contentWithState);
          }
        }
      } catch (kcError) {
        console.warn("Failed to fetch knowledge state, but will still return content:", kcError);
        // Continue to return content without knowledge state
      }
    }
    
    // If we didn't return with knowledge state, just return the content
    res.json(content);
  } catch (error) {
    console.error("Error fetching content item:", error);
    res.status(500).json({ error: 'Failed to fetch content item' });
  }
};

// Get an ordered sequence of content item IDs for quiz mode
exports.getKcSequence = async (req, res) => {
  try {
    const requestedKcId = req.query.kc_id ? parseInt(req.query.kc_id, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8; // Default to 8
    const studentId = req.user?.id; // Get studentId if user is authenticated (optionalAuth middleware)
    const startFromBeginning = req.query.start === '1'; // Check if explicitly requesting to start from the first KC
    const masteryThreshold = 0.8; // Consider KC mastered if mastery is >= this value

    console.log(`[getKcSequence] Requested KC ID: ${requestedKcId}, Limit: ${limit}, Student ID: ${studentId}, Start from beginning: ${startFromBeginning}`);

    let targetKcId = requestedKcId;

    // If no specific KC was requested or startFromBeginning is true and we have a student ID
    if ((!targetKcId || startFromBeginning) && studentId) {
      // First get the student's grade level
      const student = await db.Student.findByPk(studentId, { attributes: ['grade_level'] });
      if (student) {
        // Find all KCs for this grade level, ordered by curriculum_code
        const gradeKCs = await db.KnowledgeComponent.findAll({
          where: { grade_level: student.grade_level },
          order: [['curriculum_code', 'ASC']], // Order by curriculum code to ensure proper sequence
          attributes: ['id', 'name', 'curriculum_code'],
          raw: true
        });

        if (gradeKCs.length > 0) {
          // Get all knowledge states for the student for these KCs
          const knowledgeStates = await db.KnowledgeState.findAll({
            where: { student_id: studentId },
            include: [{ model: db.KnowledgeComponent, attributes: ['id', 'name', 'grade_level', 'curriculum_code'] }]
          });

          // Create a map of KC ID to mastery level for easier lookup
          const masteryMap = {};
          knowledgeStates.forEach(state => {
            if (state.KnowledgeComponent) {
              masteryMap[state.KnowledgeComponent.id] = state.p_mastery;
            }
          });

          if (startFromBeginning && gradeKCs.length > 0) {
            // If explicitly starting from beginning, still use first KC
            targetKcId = gradeKCs[0].id;
            console.log(`[getKcSequence] Start from beginning requested. Using first KC in curriculum sequence: ${targetKcId} (${gradeKCs[0].name}, ${gradeKCs[0].curriculum_code})`);
          } else {
            // If no knowledge states exist yet, start with the first KC
            if (knowledgeStates.length === 0) {
              targetKcId = gradeKCs[0].id;
              console.log(`[getKcSequence] New student (no knowledge states). Starting with first KC: ${targetKcId} (${gradeKCs[0].name}, ${gradeKCs[0].curriculum_code})`);
            } else {
              // Otherwise, find the first KC in curriculum sequence that hasn't been mastered
              let foundUnmasteredKc = false;
              for (const kc of gradeKCs) {
                const mastery = masteryMap[kc.id] || 0;
                if (mastery < masteryThreshold) {
                  targetKcId = kc.id;
                  foundUnmasteredKc = true;
                  console.log(`[getKcSequence] Found first unmastered KC in sequence: ${targetKcId} (${kc.name}, ${kc.curriculum_code}) with mastery ${mastery}`);
                  break;
                }
              }

              // If all KCs are mastered, use the one with lowest mastery
              if (!foundUnmasteredKc && knowledgeStates.length > 0) {
                // Sort by mastery level (ascending)
                knowledgeStates.sort((a, b) => a.p_mastery - b.p_mastery);
                if (knowledgeStates[0].KnowledgeComponent) {
                  targetKcId = knowledgeStates[0].KnowledgeComponent.id;
                  console.log(`[getKcSequence] All KCs appear mastered. Using lowest mastery KC: ${targetKcId} (${knowledgeStates[0].KnowledgeComponent.name}) with mastery ${knowledgeStates[0].p_mastery}`);
                }
              }
            }
          }
        }
      }
    }

    if (!targetKcId) {
      // If still no targetKcId, pick a random KC.
      const randomKc = await db.KnowledgeComponent.findOne({
        order: db.Sequelize.literal('RANDOM()'),
        attributes: ['id', 'name', 'curriculum_code']
      });
      if (randomKc) {
        targetKcId = randomKc.id;
        console.log(`[getKcSequence] No specific/student-derived KC, selected random KC: ${targetKcId} (${randomKc.name})`);
      } else {
        console.warn("[getKcSequence] No KCs available in the system.");
        return res.status(404).json({ error: 'No knowledge components available to generate a quiz.' });
      }
    }
    
    // Fetch the details of the target KC if not already fetched
    let finalTargetKc = await db.KnowledgeComponent.findByPk(targetKcId, {
        attributes: ['id', 'name', 'curriculum_code'],
        raw: true
    });

    if (!finalTargetKc) {
        console.warn(`[getKcSequence] Target KC ID ${targetKcId} not found.`);
        return res.status(404).json({ error: `Target knowledge component (ID: ${targetKcId}) not found.` });
    }

    // First, get all available questions for this KC
    const allQuestions = await db.ContentItem.findAll({
      where: {
        knowledge_component_id: targetKcId,
        type: { [db.Sequelize.Op.in]: ['multiple_choice', 'fill_in_blank', 'question', 'computation', 'word_problem'] }
      },
      attributes: ['id'],
      raw: true
    });

    if (!allQuestions || allQuestions.length === 0) {
      console.warn(`[getKcSequence] No questions found for KC ID: ${targetKcId} (${finalTargetKc.name})`);
      return res.status(404).json({ error: `No questions available for the selected topic: ${finalTargetKc.name}.` });
    }

    // Create a sequence of exactly 'limit' questions by duplicating if necessary
    let sequence = [];
    while (sequence.length < limit) {
      // Randomly select a question from allQuestions
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      const question = allQuestions[randomIndex];
      sequence.push({
        id: question.id,
        kcId: finalTargetKc.id,
        kcName: finalTargetKc.name,
        curriculumCode: finalTargetKc.curriculum_code
      });
    }
    
    console.log(`[getKcSequence] Generated sequence with ${sequence.length} questions for KC ID: ${targetKcId} (${finalTargetKc.name})`);
    res.json(sequence);

  } catch (error) {
    console.error("Error in getKcSequence:", error);
    if (error.message && error.message.toLowerCase().includes('random')) {
        console.error("RANDOM() might not be supported by the current DB dialect or version. Consider alternative randomization if issues persist.");
    }
    res.status(500).json({ error: 'Failed to fetch quiz sequence' });
  }
};

// Get content for a specific knowledge component
exports.getContentForKnowledgeComponent = async (req, res) => {
  try {
    const kcId = parseInt(req.params.kcId, 10);
    if (isNaN(kcId)) {
       return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
    }
    const { language = 'English' } = req.query; // Difficulty filter removed for simplicity, add back if needed

    const contentItems = await db.ContentItem.findAll({
      where: {
        knowledge_component_id: kcId,
        language: language
        // Add difficulty filter here if required, e.g.,
        // difficulty: { [db.Sequelize.Op.between]: [difficulty - 0.1, difficulty + 0.1] }
      }
    });

    // Sequelize handles JSONB parsing automatically
    res.json(contentItems);
  } catch (error) {
    console.error("Error fetching content for KC:", error);
    res.status(500).json({ error: 'Failed to fetch content for knowledge component' });
  }
};

// Get a single question for a specific knowledge component (e.g., for practice)
exports.getQuestionForKnowledgeComponent = async (req, res) => {
  try {
    const kcId = parseInt(req.params.kcId, 10);
    if (isNaN(kcId)) {
       return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
    }

    // Find all *question* type content items for the KC
    const questionItems = await db.ContentItem.findAll({
      where: {
        knowledge_component_id: kcId,
        type: { [db.Sequelize.Op.in]: ['question', 'multiple_choice', 'fill_in_blank'] } // Filter for question types
      }
    });

    if (!questionItems || questionItems.length === 0) {
      return res.status(404).json({ error: 'No questions found for this topic yet.' });
    }

    // Select a random question from the list
    const randomIndex = Math.floor(Math.random() * questionItems.length);
    const randomQuestion = questionItems[randomIndex];

    // Optionally include student's knowledge state for this KC if user is logged in
     if (req.user && req.user.role === 'student') {
       try {
         const knowledgeState = await db.KnowledgeState.findOne({
           where: {
             student_id: req.user.id,
             knowledge_component_id: kcId
           }
         });
         if (knowledgeState) {
           const questionWithState = randomQuestion.toJSON();
           questionWithState.knowledgeState = knowledgeState;
           return res.json(questionWithState);
         }
       } catch (kcError) {
         console.warn("Failed to fetch knowledge state for KC question, returning question only:", kcError);
       }
     }

    res.json(randomQuestion); // Return the randomly selected question

  } catch (error) {
    console.error("Error fetching question for KC:", error);
    res.status(500).json({ error: 'Failed to fetch question for knowledge component' });
  }
};
