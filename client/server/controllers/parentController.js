/**
 * Parent Controller
 * 
 * This controller handles API routes related to parent operations,
 * including student monitoring and progress tracking.
 */

// Old DB and models removed
// const db_sqlite = require('../db/database'); // Renamed to avoid conflict
// const StudentModel = require('../models/studentModel');
// const ContentManager = require('../models/contentManager');
const db = require('../models'); // Import Sequelize db object
const { Op } = require('sequelize'); // Import Sequelize operators

// Get parent profile
exports.getParentProfile = async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id; // From authenticateToken middleware

    // Ensure the authenticated user is requesting their own profile
    if (requestedId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own profile.' });
    }

    const parent = await db.Parent.findByPk(requestedId); // Use Sequelize findByPk

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    res.json(parent);
  } catch (error) {
    console.error("Error fetching parent profile:", error);
    res.status(500).json({ error: 'Failed to fetch parent profile' });
  }
};

// Update parent profile
exports.updateParentProfile = async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id; // From authenticateToken middleware

    // Ensure the authenticated user is updating their own profile
    if (requestedId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }

    // Prevent updating sensitive fields like id, role, auth_id, password, timestamps
    const { id: reqId, role, auth_id, password, createdAt, updatedAt, ...updateData } = req.body;

    const [affectedRows] = await db.Parent.update(updateData, {
      where: { id: requestedId }
    });

    if (affectedRows > 0) {
      const updatedParent = await db.Parent.findByPk(requestedId);
      res.json(updatedParent);
    } else {
      // Check if parent exists before saying not found vs no changes
      const parentExists = await db.Parent.findByPk(requestedId);
      if (!parentExists) {
         return res.status(404).json({ error: 'Parent not found' });
      }
      // If parent exists but no rows affected, likely no changes needed or data was same
      const currentParent = await db.Parent.findByPk(requestedId); // Return current data
      res.json(currentParent);
    }
  } catch (error) {
    console.error("Error updating parent profile:", error);
    res.status(500).json({ error: 'Failed to update parent profile' });
  }
};

// Get parent's children
exports.getChildren = async (req, res) => {
  try {
    const parentId = parseInt(req.params.id, 10);
    if (isNaN(parentId)) {
       return res.status(400).json({ error: 'Invalid Parent ID' });
    }

    const parent = await db.Parent.findByPk(parentId, {
      include: [{
        model: db.Student,
        attributes: ['id', 'name', 'grade_level', 'last_login'], // Select specific student fields
        through: { attributes: [] } // Don't include junction table attributes
      }]
    });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Sequelize handles JSONB parsing automatically
    res.json(parent.Students || []); // Return the students array
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
};

// Get weekly progress report for a child
// TODO: This function needs significant refactoring and likely simplification.
// The original logic fetches past states and calculates diffs, which can be complex and slow.
// A simpler approach might focus on current mastery and recent activity.
// Also removing sample data generation.
exports.getWeeklyProgressReport = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const today = new Date();

    // Fetch data in parallel
    const [student, currentKnowledgeStates, weeklyResponses] = await Promise.all([
      db.Student.findByPk(studentId, { attributes: ['id', 'name', 'grade_level'] }),
      db.KnowledgeState.findAll({
        where: { student_id: studentId },
        // Revert to explicit attributes, including description as it was originally there
        include: [{ model: db.KnowledgeComponent, attributes: ['id', 'name', 'curriculum_code', 'description'] }]
      }),
      db.Response.findAll({
        where: {
          student_id: studentId,
          createdAt: { [Op.gte]: oneWeekAgo } // Responses from the past week
        },
        include: [{
          model: db.ContentItem,
          attributes: ['knowledge_component_id'], // Only need KC ID here
          include: [{ model: db.KnowledgeComponent, attributes: ['name', 'curriculum_code'] }] // Get KC details via ContentItem
        }],
        order: [['createdAt', 'DESC']]
      })
      // TODO: Consider fetching previous knowledge states if complex diff logic is truly needed.
      // This requires querying historical state data or snapshots, which isn't directly supported by the current schema.
    ]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // --- Calculate Aggregated Metrics ---

    // Overall current mastery
    const totalCurrentMastery = currentKnowledgeStates.reduce((sum, state) => sum + state.p_mastery, 0);
    const averageCurrentMastery = currentKnowledgeStates.length > 0 ? totalCurrentMastery / currentKnowledgeStates.length : 0;

    // Weekly activity
    const totalResponses = weeklyResponses.length;
    const correctResponses = weeklyResponses.filter(r => r.correct === true).length;
    const overallCorrectRate = totalResponses > 0 ? correctResponses / totalResponses : 0;
    const totalTimeSpent = weeklyResponses.reduce((sum, r) => sum + (r.time_spent || 0), 0);

    // Activity by Day
    const activityByDay = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(day => { activityByDay[day] = { day, count: 0, correct: 0 }; });
    weeklyResponses.forEach(response => {
      const date = new Date(response.createdAt); // Use Sequelize timestamp
      const day = days[date.getDay()];
      activityByDay[day].count++;
      if (response.correct === true) {
        activityByDay[day].correct++;
      }
    });

     // Progress by KC (Simplified: Current state and weekly activity)
     const progressByKC = {};
     currentKnowledgeStates.forEach(state => {
       if (!state.KnowledgeComponent) return; // Skip if KC data missing
       const kcId = state.knowledge_component_id;
       progressByKC[kcId] = {
         id: kcId,
         name: state.KnowledgeComponent.name,
         curriculum_code: state.KnowledgeComponent.curriculum_code,
         description: state.KnowledgeComponent.description,
         currentMastery: state.p_mastery,
         // previousMastery: 0, // Removed for simplicity
         // masteryGain: 0,     // Removed for simplicity
         totalResponses: 0,
         correctResponses: 0,
         correctRate: 0
       };
     });
     weeklyResponses.forEach(response => {
       if (!response.ContentItem) return; // Skip if ContentItem missing
       const kcId = response.ContentItem.knowledge_component_id;
       if (progressByKC[kcId]) {
         progressByKC[kcId].totalResponses++;
         if (response.correct === true) {
           progressByKC[kcId].correctResponses++;
         }
       }
     });
     Object.values(progressByKC).forEach(kc => {
       kc.correctRate = kc.totalResponses > 0 ? kc.correctResponses / kc.totalResponses : 0;
     });


    // --- Prepare Report (Simplified, without sample data) ---
    const weeklyReport = {
      student: student.toJSON(),
      reportPeriod: {
        from: oneWeekAgo.toISOString(),
        to: today.toISOString()
      },
      overallProgress: {
        currentMastery: averageCurrentMastery,
        // previousMastery: averagePreviousMastery, // Removed for simplicity
        // masteryGain: averageCurrentMastery - averagePreviousMastery, // Removed
        totalResponses,
        correctResponses,
        correctRate: overallCorrectRate
      },
      // weeklyProgress: weeklyProgress, // Removed sample data section
      progressByKnowledgeComponent: Object.values(progressByKC)
         .sort((a, b) => (a.curriculum_code || '').localeCompare(b.curriculum_code || '')), // Sort by code
      activityByDay: Object.values(activityByDay),
      recentResponses: weeklyResponses.slice(0, 10).map(response => ({ // Map to simpler format
        id: response.id,
        // content: response.ContentItem?.content, // Maybe too verbose?
        answer: response.answer,
        correct: response.correct,
        time_spent: response.time_spent,
        created_at: response.createdAt,
        knowledge_component: response.ContentItem?.KnowledgeComponent ? {
          id: response.ContentItem.knowledge_component_id,
          name: response.ContentItem.KnowledgeComponent.name,
          curriculum_code: response.ContentItem.KnowledgeComponent.curriculum_code
        } : null
      })),
      // achievements: [], // TODO: Implement achievement logic
      // recommendations: [], // TODO: Implement recommendation logic
      // upcomingContent: [] // TODO: Implement upcoming content logic
    };

    res.json(weeklyReport);
  } catch (error) {
    console.error("Error generating weekly report:", error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
};

// Get detailed progress for a specific knowledge component
exports.getKnowledgeComponentProgress = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const kcId = parseInt(req.params.kcId, 10);

    if (isNaN(studentId) || isNaN(kcId)) {
      return res.status(400).json({ error: 'Invalid Student or Knowledge Component ID' });
    }

    // Fetch data in parallel
    const [student, knowledgeComponent, knowledgeState, responses] = await Promise.all([
      db.Student.findByPk(studentId, { attributes: ['id', 'name', 'grade_level'] }),
      db.KnowledgeComponent.findByPk(kcId, { attributes: ['id', 'name', 'curriculum_code', 'description'] }),
      db.KnowledgeState.findOne({ where: { student_id: studentId, knowledge_component_id: kcId } }),
      db.Response.findAll({
        where: { student_id: studentId },
        include: [{
          model: db.ContentItem,
          attributes: ['type', 'difficulty', 'content'], // Include content details
          where: { knowledge_component_id: kcId } // Filter responses by KC via ContentItem
        }],
        order: [['createdAt', 'DESC']] // Get all responses, sort descending
      })
    ]);

    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!knowledgeComponent) return res.status(404).json({ error: 'Knowledge component not found' });

    // Calculate progress metrics
    const totalResponses = responses.length;
    const correctResponses = responses.filter(r => r.correct === true).length;
    const correctRate = totalResponses > 0 ? correctResponses / totalResponses : 0;
    const totalTimeSpent = responses.reduce((sum, r) => sum + (r.time_spent || 0), 0);
    const averageTimeSpent = totalResponses > 0 ? totalTimeSpent / totalResponses : 0;

    // Calculate mastery history (using simple approximation as before, requires BKT model ideally)
    // TODO: Replace this simple approximation with actual BKT logic if available
    const masteryHistory = [];
    let currentSimulatedMastery = knowledgeState?.p_mastery || 0.3; // Start from current state or default

    // Sort responses ascending for history calculation
    const sortedResponses = [...responses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sortedResponses.forEach(response => {
      const pSlip = knowledgeState?.p_slip || 0.1; // Use defaults if state missing
      const pGuess = knowledgeState?.p_guess || 0.2;
      const pTransit = knowledgeState?.p_transit || 0.1;
      let pLearn = pTransit; // Approximation

      let pCorrectGivenMastery = 1 - pSlip;
      let pCorrectGivenNotMastery = pGuess;

      let pMasteryUpdate;
      if (response.correct === true) {
         pMasteryUpdate = (currentSimulatedMastery * pCorrectGivenMastery) /
                          (currentSimulatedMastery * pCorrectGivenMastery + (1 - currentSimulatedMastery) * pCorrectGivenNotMastery);
      } else {
         pMasteryUpdate = (currentSimulatedMastery * (1 - pCorrectGivenMastery)) /
                          (currentSimulatedMastery * (1 - pCorrectGivenMastery) + (1 - currentSimulatedMastery) * (1 - pCorrectGivenNotMastery));
      }
      currentSimulatedMastery = pMasteryUpdate + (1 - pMasteryUpdate) * pLearn;
      currentSimulatedMastery = Math.max(0.01, Math.min(0.99, currentSimulatedMastery)); // Clamp probability

      masteryHistory.push({
        date: response.createdAt,
        mastery: currentSimulatedMastery,
        correct: response.correct
      });
    });


    // Prepare response
    const kcProgress = {
      student: student.toJSON(),
      knowledgeComponent: knowledgeComponent.toJSON(),
      currentState: knowledgeState, // Current actual state from DB
      progressMetrics: {
        totalResponses,
        correctResponses,
        correctRate,
        averageTimeSpent
      },
      masteryHistory, // Simulated history based on responses
      recentResponses: responses.slice(0, 10).map(r => ({ // Map to simpler format
         id: r.id,
         content: r.ContentItem?.content,
         answer: r.answer,
         correct: r.correct,
         time_spent: r.time_spent,
         created_at: r.createdAt,
         difficulty: r.ContentItem?.difficulty,
         type: r.ContentItem?.type
      }))
    };

    res.json(kcProgress);
  } catch (error) {
    console.error("Error fetching KC progress:", error);
    res.status(500).json({ error: 'Failed to fetch knowledge component progress' });
  }
};

// Link a parent to a student
exports.linkParentToStudent = async (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId, 10);
    const studentId = parseInt(req.params.studentId, 10);
    const authenticatedUserId = req.user.id; // From middleware

    if (isNaN(parentId) || isNaN(studentId)) {
       return res.status(400).json({ error: 'Invalid Parent or Student ID' });
    }

    // Security Check: Ensure the authenticated user is the parent making the link request
    if (parentId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden: You can only link your own profile.' });
    }

    const parent = await db.Parent.findByPk(parentId);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const student = await db.Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Use Sequelize association method to add student
    await parent.addStudent(student); // `addStudent` comes from the belongsToMany association

    res.status(201).json({
      success: true,
      message: 'Parent linked to student',
      parent_id: parentId,
      student_id: studentId
    });

  } catch (error) {
     // Handle potential unique constraint violation if already added
     if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Parent is already linked to this student' });
     }
    console.error("Error linking parent to student:", error);
    res.status(500).json({ error: 'Failed to link parent to student' });
  }
};

// Unlink a parent from a student
exports.unlinkParentFromStudent = async (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId, 10);
    const studentId = parseInt(req.params.studentId, 10);
    const authenticatedUserId = req.user.id; // From middleware

    if (isNaN(parentId) || isNaN(studentId)) {
       return res.status(400).json({ error: 'Invalid Parent or Student ID' });
    }

    // Security Check: Ensure the authenticated user is the parent making the unlink request
    if (parentId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden: You can only unlink from your own profile.' });
    }

    const parent = await db.Parent.findByPk(parentId);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const student = await db.Student.findByPk(studentId);
    if (!student) {
      // If student doesn't exist, the link can't exist either.
      return res.status(404).json({ error: 'Student not found' });
    }

    // Use Sequelize association method to remove student
    const removed = await parent.removeStudent(student); // `removeStudent` from belongsToMany

    if (removed === 0) {
       // This indicates the student wasn't associated with the parent
       return res.status(404).json({ error: 'Student not linked to this parent' });
    }

    res.json({
      success: true,
      message: 'Parent unlinked from student',
      parent_id: parentId,
      student_id: studentId
    });

  } catch (error) {
    console.error("Error unlinking parent from student:", error);
    res.status(500).json({ error: 'Failed to unlink parent from student' });
  }
};

// Get communication messages for a parent
exports.getMessages = async (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId, 10);
    const authenticatedUserId = req.user.id; // From middleware

    if (isNaN(parentId)) {
       return res.status(400).json({ error: 'Invalid Parent ID' });
    }

    // Security Check: Ensure the authenticated user is the parent requesting messages
    if (parentId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own messages.' });
    }

    // Assuming a Message model exists and is associated with Parent
    // TODO: Create Message model and associations if they don't exist
    if (!db.Message) {
        console.warn("Message model not found. Returning empty array for messages.");
        return res.json([]); // Return empty array instead of error
    }

    const messages = await db.Message.findAll({
      where: { parent_id: parentId },
      order: [['sent_at', 'DESC']] // Assuming sent_at field exists
      // Consider adding associations to Teacher/System if needed
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};
