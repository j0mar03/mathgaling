/**
 * Teacher Controller
 * 
 * This controller handles API routes related to teacher operations,
 * including student monitoring, class management, and intervention recommendations.
 */

// Old DB and models removed
// const db_sqlite = require('../db/database'); // Renamed to avoid conflict
// const StudentModel = require('../models/studentModel');
// const ContentManager = require('../models/contentManager');
// const FuzzyLogicEngine = require('../models/fuzzyLogicEngine'); // Removed as file was deleted
const db = require('../models'); // Import Sequelize db object
const { Op } = require('sequelize'); // Import Sequelize operators if needed
const { Teacher, Classroom, Student, KnowledgeState, Response, EngagementMetric, LearningPath, KnowledgeComponent, ContentItem } = db; // Added KC and CI models

// Get teacher profile
exports.getTeacherProfile = async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id; // From authenticateToken middleware

    // Ensure the authenticated user is requesting their own profile
    if (requestedId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own profile.' });
    }

    const teacher = await db.Teacher.findByPk(requestedId); // Use Sequelize findByPk

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    // Sequelize handles JSONB parsing automatically
    res.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({ error: 'Failed to fetch teacher profile' });
  }
};

// Get a specific classroom by ID, ensuring the requesting teacher owns it
exports.getClassroomById = async (req, res) => {
  try {
    const classroomId = parseInt(req.params.id, 10);
    const teacherId = req.user.id; // Get teacher ID from authenticated user

    if (isNaN(classroomId)) {
      return res.status(400).json({ error: 'Invalid Classroom ID' });
    }

    const classroom = await db.Classroom.findOne({
      where: {
        id: classroomId,
        teacher_id: teacherId // Verify ownership
      }
    });

    if (!classroom) {
      // Return 404 if classroom not found OR if teacher doesn't own it
      return res.status(404).json({ error: 'Classroom not found or access denied.' });
    }

    res.json(classroom);

  } catch (error) {
    console.error("Error fetching classroom by ID:", error);
    res.status(500).json({ error: 'Failed to fetch classroom' });
  }
};

// Update teacher profile
exports.updateTeacherProfile = async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const authenticatedUserId = req.user.id; // From authenticateToken middleware

    // Ensure the authenticated user is updating their own profile
    if (requestedId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }

    // Prevent updating sensitive fields like id, role, auth_id, password, timestamps
    const { id: reqId, role, auth_id, password, createdAt, updatedAt, ...updateData } = req.body;

    const [affectedRows] = await db.Teacher.update(updateData, {
      where: { id: requestedId }
    });

    if (affectedRows > 0) {
      const updatedTeacher = await db.Teacher.findByPk(requestedId);
      res.json(updatedTeacher);
    } else {
      // Check if teacher exists before saying not found vs no changes
      const teacherExists = await db.Teacher.findByPk(requestedId);
      if (!teacherExists) {
         return res.status(404).json({ error: 'Teacher not found' });
      }
      // If teacher exists but no rows affected, likely no changes needed or data was same
      const currentTeacher = await db.Teacher.findByPk(requestedId); // Return current data
      res.json(currentTeacher);
    }
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    res.status(500).json({ error: 'Failed to update teacher profile' });
  }
};

// Get teacher's classrooms
exports.getClassrooms = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id, 10);
     if (isNaN(teacherId)) {
       return res.status(400).json({ error: 'Invalid Teacher ID' });
    }

    const classrooms = await db.Classroom.findAll({
      where: { teacher_id: teacherId }
    });
    // Sequelize handles JSONB parsing automatically
    res.json(classrooms);
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
};

// Get students in a classroom
exports.getClassroomStudents = async (req, res) => {
  try {
    const classroomId = parseInt(req.params.id, 10); // Use req.params.id to match route definition
     if (isNaN(classroomId)) {
       return res.status(400).json({ error: 'Invalid Classroom ID' });
    }

    const classroom = await db.Classroom.findByPk(classroomId, {
      include: [{
        model: db.Student,
        attributes: ['id', 'name', 'grade_level', 'last_login'], // Select specific student fields
        through: { attributes: [] } // Don't include junction table attributes
      }]
    });

    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Sequelize handles JSONB parsing automatically
    res.json(classroom.Students || []); // Return the students array
  } catch (error) {
    console.error("Error fetching classroom students:", error);
    res.status(500).json({ error: 'Failed to fetch classroom students' });
  }
};

// Get classroom performance for a specific knowledge component
exports.getClassroomPerformance = async (req, res) => {
    try {
        const kcId = parseInt(req.params.id, 10);
        if (isNaN(kcId)) {
            return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
        }

        // Get the teacher's classrooms
        const teacherId = req.user.id;
        const classrooms = await db.Classroom.findAll({
            where: { teacher_id: teacherId },
            include: [{ model: db.Student, attributes: ['id', 'name'] }]
        });

        if (!classrooms || classrooms.length === 0) {
            return res.json({
                studentPerformance: [],
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

        // Get all student IDs from the teacher's classrooms
        const studentIds = classrooms.flatMap(c => c.Students.map(s => s.id));

        // Get knowledge states for all students for this KC
        const knowledgeStates = await db.KnowledgeState.findAll({
            where: {
                student_id: { [db.Sequelize.Op.in]: studentIds },
                knowledge_component_id: kcId
            }
        });

        // Get responses for all students for this KC
        const responses = await db.Response.findAll({
            where: {
                student_id: { [db.Sequelize.Op.in]: studentIds }
            },
            include: [{
                model: db.ContentItem,
                where: { knowledge_component_id: kcId },
                attributes: ['id', 'type', 'difficulty']
            }],
            attributes: ['id', 'student_id', 'correct', 'time_spent', 'createdAt']
        });

        // Process student performance data
        const studentPerformance = studentIds.map(studentId => {
            const student = classrooms
                .flatMap(c => c.Students)
                .find(s => s.id === studentId);

            const studentResponses = responses.filter(r => r.student_id === studentId);
            const studentKnowledgeState = knowledgeStates.find(ks => ks.student_id === studentId);

            const totalResponses = studentResponses.length;
            const correctResponses = studentResponses.filter(r => r.correct).length;
            const correctRate = totalResponses > 0 ? correctResponses / totalResponses : 0;
            const totalTimeSpent = studentResponses.reduce((sum, r) => sum + (r.time_spent || 0), 0);
            const averageTime = totalResponses > 0 ? totalTimeSpent / totalResponses : 0;

            return {
                student_id: studentId,
                student_name: student ? student.name : 'Unknown Student',
                mastery: studentKnowledgeState ? studentKnowledgeState.p_mastery : 0,
                correctRate,
                correctResponses,
                totalResponses,
                averageTime
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

        studentPerformance.forEach(student => {
            const mastery = student.mastery;
            if (mastery < 0.2) masteryDistribution.veryLow++;
            else if (mastery < 0.4) masteryDistribution.low++;
            else if (mastery < 0.6) masteryDistribution.medium++;
            else if (mastery < 0.8) masteryDistribution.high++;
            else masteryDistribution.veryHigh++;
        });

        // Calculate average mastery
        const averageMastery = studentPerformance.reduce((sum, student) => sum + student.mastery, 0) / studentPerformance.length;

        res.json({
            studentPerformance,
            masteryDistribution,
            totalStudents: studentPerformance.length,
            averageMastery
        });

    } catch (error) {
        console.error('Error fetching classroom performance:', error);
        res.status(500).json({ error: 'Failed to fetch classroom performance data' });
    }
};

// Get detailed performance for a specific student
exports.getStudentDetailedPerformance = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID' });
    }

    // Fetch data in parallel
    const [student, knowledgeStates, responses, learningPath, engagementMetrics] = await Promise.all([
      db.Student.findByPk(studentId),
      db.KnowledgeState.findAll({
        where: { student_id: studentId },
        include: [{ model: db.KnowledgeComponent, attributes: ['name', 'curriculum_code'] }]
      }),
      db.Response.findAll({
        where: { student_id: studentId },
        include: [{
          model: db.ContentItem,
          attributes: ['knowledge_component_id', 'type', 'difficulty', 'content'],
          include: [{ model: db.KnowledgeComponent, attributes: ['name', 'curriculum_code'] }]
        }],
        order: [['createdAt', 'DESC']],
        limit: 20 // Keep limit for recent responses
      }),
      db.LearningPath.findOne({ where: { student_id: studentId, status: 'active' } }),
      db.EngagementMetric.findAll({ where: { student_id: studentId }, order: [['createdAt', 'DESC']] }) // Fetch all or latest? Fetching all for now
    ]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Calculate performance metrics by knowledge component
    const performanceByKC = {};
    responses.forEach(response => {
      if (!response.ContentItem || !response.ContentItem.KnowledgeComponent) return; // Skip if KC data is missing

      const kcId = response.ContentItem.knowledge_component_id;
      const kcName = response.ContentItem.KnowledgeComponent.name;
      const kcCode = response.ContentItem.KnowledgeComponent.curriculum_code;

      if (!performanceByKC[kcId]) {
        performanceByKC[kcId] = {
          name: kcName,
          curriculum_code: kcCode,
          totalResponses: 0,
          correctResponses: 0,
          totalTime: 0,
          mastery: 0 // Default mastery
        };
        // Find and add mastery from knowledge states
        const state = knowledgeStates.find(s => s.knowledge_component_id === kcId);
        if (state) {
          performanceByKC[kcId].mastery = state.p_mastery;
        }
      }

      performanceByKC[kcId].totalResponses++;
      if (response.correct === true) { // Check boolean true
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
    const totalMastery = knowledgeStates.reduce((sum, state) => sum + state.p_mastery, 0);
    const averageMastery = knowledgeStates.length > 0 ? totalMastery / knowledgeStates.length : 0;
    const totalRecentResponses = responses.length;
    const correctRecentResponses = responses.filter(r => r.correct === true).length;
    const overallCorrectRate = totalRecentResponses > 0 ? correctRecentResponses / totalRecentResponses : 0;

    // Fuzzy logic recommendations (assuming FuzzyLogicEngine exists and works)
    // TODO: Re-implement or integrate Fuzzy Logic for recommendations
    // const fuzzyEngine = new FuzzyLogicEngine();
    // TODO: Refine engagement calculation based on actual metrics structure
    const latestEngagementMetric = engagementMetrics.length > 0 ? engagementMetrics[0] : null;
    // const engagementScore = latestEngagementMetric ? fuzzyEngine.calculateEngagement(latestEngagementMetric.toJSON()) : 0.5;
    const engagementScore = 0.5; // Placeholder
    // const adaptiveRecommendations = fuzzyEngine.processInputs({
    //   mastery: averageMastery,
    //   engagement: engagementScore,
    //   responseTime: 0.5, // Placeholder
    //   helpUsage: latestEngagementMetric?.help_requests ? (latestEngagementMetric.help_requests > 3 ? 0.8 : 0.3) : 0.3 // Example placeholder
    // });
     // Placeholder recommendations
     const adaptiveRecommendations = { teacherAlert: 0.5, teacherAlertLabel: 'Medium', recommendations: ['Review recent activity'] };

    // Prepare response
    const detailedPerformance = {
      student: student.toJSON(), // Send plain object
      knowledgeStates, // Already includes KC name/code
      performanceByKC,
      recentResponses: responses, // Already includes ContentItem and KC details
      learningPath,
      engagementMetrics, // Send all fetched metrics
      overallMetrics: {
        averageMastery,
        engagement: engagementScore, // Send calculated score
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
     console.error("Error fetching student detailed performance:", error);
    res.status(500).json({ error: 'Failed to fetch student detailed performance' });
  }
};

// Get class-wide knowledge component performance
exports.getClassKnowledgeComponentPerformance = async (req, res) => {
  try {
    const classroomId = parseInt(req.params.id, 10); // Use req.params.id to match route definition
    if (isNaN(classroomId)) {
      return res.status(400).json({ error: 'Invalid Classroom ID' });
    }

    // 1. Get student IDs in the classroom
    const classroom = await db.Classroom.findByPk(classroomId, {
      include: [{ model: db.Student, attributes: ['id'] }]
    });

    if (!classroom || !classroom.Students || classroom.Students.length === 0) {
      return res.json([]); // Return empty array if classroom not found or no students
    }
    const studentIds = classroom.Students.map(s => s.id);

    // 2. Get all knowledge components (or filter by relevant grade levels if needed)
    const knowledgeComponents = await db.KnowledgeComponent.findAll({
       attributes: ['id', 'name', 'curriculum_code', 'grade_level', 'description']
       // Consider adding a where clause if KCs are specific to classroom grade level
    });

    // 3. Get all relevant knowledge states for students in this class
    const allKnowledgeStates = await db.KnowledgeState.findAll({
      where: {
        student_id: { [Op.in]: studentIds } // Filter by students in the class
      },
      attributes: ['knowledge_component_id', 'p_mastery']
    });

    // 4. Aggregate mastery data by knowledge component using a Map for efficiency
    const kcPerformanceMap = new Map();

    knowledgeComponents.forEach(kc => {
      kcPerformanceMap.set(kc.id, {
        id: kc.id,
        name: kc.name,
        curriculum_code: kc.curriculum_code,
        grade_level: kc.grade_level,
        description: kc.description,
        totalStudents: 0,
        masterySum: 0,
        masteryLevels: { veryLow: 0, low: 0, medium: 0, high: 0, veryHigh: 0 }
      });
    });

    // Process all knowledge states
    allKnowledgeStates.forEach(state => {
      const kcData = kcPerformanceMap.get(state.knowledge_component_id);
      if (kcData) {
        kcData.totalStudents++;
        kcData.masterySum += state.p_mastery;

        // Categorize mastery level
        if (state.p_mastery < 0.2) kcData.masteryLevels.veryLow++;
        else if (state.p_mastery < 0.4) kcData.masteryLevels.low++;
        else if (state.p_mastery < 0.6) kcData.masteryLevels.medium++;
        else if (state.p_mastery < 0.8) kcData.masteryLevels.high++;
        else kcData.masteryLevels.veryHigh++;
      }
    });

    // 5. Calculate average mastery and format results
    const result = Array.from(kcPerformanceMap.values())
      .filter(kc => kc.totalStudents > 0) // Only include KCs with data for this class
      .map(kc => ({
        ...kc, // Spread existing data
        averageMastery: kc.masterySum / kc.totalStudents // Calculate average
      }))
      .sort((a, b) => (a.curriculum_code || '').localeCompare(b.curriculum_code || '')); // Sort

    res.json(result);
  } catch (error) {
    console.error("Error fetching class KC performance:", error);
    res.status(500).json({ error: 'Failed to fetch class knowledge component performance' });
  }
};

// Create a new classroom
exports.createClassroom = async (req, res) => {
  try {
    // Destructure fields from body - REMOVED teacher_id as it comes from auth token (req.user.id)
    const { name, settings, studentIds } = req.body;

    // Validate teacher_id exists (using authenticated user is better)
    const authenticatedTeacherId = req.user.id; // Use ID from token
    if (!authenticatedTeacherId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    // Optional: Verify teacher exists in DB if needed, but token implies existence
    // const teacher = await db.Teacher.findByPk(authenticatedTeacherId);
    // if (!teacher) {
    //   return res.status(404).json({ error: 'Authenticated teacher not found.' });
    // }

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Classroom name is required.' });
    }

    // Create the classroom
    const newClassroom = await db.Classroom.create({
      teacher_id: authenticatedTeacherId, // Use authenticated teacher's ID
      name: name.trim(),
      settings: settings || {} // Sequelize handles JSON stringification
    });

    // If studentIds are provided, add them to the classroom
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      // Optional: Validate that the provided student IDs actually exist
      const validStudents = await db.Student.findAll({
        where: { id: studentIds },
        attributes: ['id'] // Only need IDs for validation
      });
      const validStudentIds = validStudents.map(s => s.id);

      if (validStudentIds.length !== studentIds.length) {
         console.warn("Some provided student IDs were invalid during classroom creation.");
         // Decide whether to proceed with valid ones or return an error
         // Proceeding with valid ones for now.
      }

      if (validStudentIds.length > 0) {
          const links = validStudentIds.map(studentId => ({
            classroom_id: newClassroom.id,
            student_id: studentId,
            joined_at: new Date()
          }));

          await db.ClassroomStudent.bulkCreate(links, {
            ignoreDuplicates: true // Avoid errors if a student is somehow listed twice
          });
          console.log(`Added ${validStudentIds.length} students to new classroom ${newClassroom.id}`);
      }
    }

    // Return the created classroom object
    res.status(201).json(newClassroom);
  } catch (error) {
    console.error("Error creating classroom:", error);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
};

// Add a student to a classroom
exports.addStudentToClassroom = async (req, res) => {
  try {
    const classroomId = parseInt(req.params.classroomId, 10);
    const studentId = parseInt(req.params.studentId, 10);

    if (isNaN(classroomId) || isNaN(studentId)) {
       return res.status(400).json({ error: 'Invalid Classroom or Student ID' });
    }

    const classroom = await db.Classroom.findByPk(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const student = await db.Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Use Sequelize association method to add student
    await classroom.addStudent(student); // `addStudent` comes from the belongsToMany association

    res.status(201).json({
      success: true,
      message: 'Student added to classroom',
      classroom_id: classroomId,
      student_id: studentId
    });

  } catch (error) {
     // Handle potential unique constraint violation if already added
     if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Student is already in this classroom' });
     }
    console.error("Error adding student to classroom:", error);
    res.status(500).json({ error: 'Failed to add student to classroom' });
  }
};

// Remove a student from a classroom
exports.removeStudentFromClassroom = async (req, res) => {
  try {
    const classroomId = parseInt(req.params.classroomId, 10);
    const studentId = parseInt(req.params.studentId, 10);

     if (isNaN(classroomId) || isNaN(studentId)) {
       return res.status(400).json({ error: 'Invalid Classroom or Student ID' });
    }

    const classroom = await db.Classroom.findByPk(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const student = await db.Student.findByPk(studentId);
    if (!student) {
      // Technically removing a non-existent student might not be an error,
      // but returning 404 is clearer if the intent is specific.
      return res.status(404).json({ error: 'Student not found' });
    }

    // Use Sequelize association method to remove student
    const removed = await classroom.removeStudent(student); // `removeStudent` from belongsToMany

    if (removed === 0) {
       // This indicates the student wasn't associated with the classroom
       return res.status(404).json({ error: 'Student not found in this classroom' });
    }

    res.json({
      success: true,
      message: 'Student removed from classroom',
      classroom_id: classroomId,
      student_id: studentId
    });

  } catch (error) {
    console.error("Error removing student from classroom:", error);
    res.status(500).json({ error: 'Failed to remove student from classroom' });
  }
};

// --- Content Item Management (Teacher Only) ---

// List Content Items created by the logged-in teacher
exports.listMyContentItems = async (req, res) => {
  const teacherId = req.user.id; // Get teacher ID from authenticated user

  try {
    const contentItems = await ContentItem.findAll({
      where: { teacher_id: teacherId },
      include: [{ model: KnowledgeComponent, attributes: ['id', 'name', 'grade_level'] }], // Include basic KC info
      order: [['updatedAt', 'DESC']] // Order by most recently updated
    });
    res.json(contentItems);
  } catch (error) {
    console.error("Error listing teacher's content items:", error);
    res.status(500).json({ error: "Failed to fetch teacher's content items" });
  }
};

// Create a new Content Item linked to a Knowledge Component
exports.createContentItem = async (req, res) => {
  const teacherId = req.user.id;
  const { knowledge_component_id, type, content, metadata, difficulty, language } = req.body;

  // --- Validation ---
  if (!knowledge_component_id || !type || !content) {
    return res.status(400).json({ error: 'knowledge_component_id, type, and content are required.' });
  }

  try {
    // Verify the Knowledge Component exists
    const kcExists = await KnowledgeComponent.findByPk(knowledge_component_id);
    if (!kcExists) {
      return res.status(400).json({ error: `Knowledge Component with ID ${knowledge_component_id} not found.` });
    }

    // Create the content item, associating it with the teacher and KC
    const newContentItem = await ContentItem.create({
      knowledge_component_id,
      teacher_id: teacherId, // Set ownership
      type,
      content,
      metadata,
      difficulty,
      language: language || 'English' // Default language if not provided
    });

    res.status(201).json(newContentItem);

  } catch (error) {
    console.error("Error creating content item:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to create content item.' });
  }
};

// Update a Content Item owned by the teacher
exports.updateContentItem = async (req, res) => {
  const teacherId = req.user.id;
  const contentItemId = parseInt(req.params.id, 10);

  // Exclude fields that shouldn't be updated directly or are immutable
  const { id: bodyId, teacher_id: bodyTeacherId, createdAt, updatedAt, ...updateData } = req.body;

  if (isNaN(contentItemId)) {
    return res.status(400).json({ error: 'Invalid Content Item ID provided.' });
  }

  // Prevent changing the associated Knowledge Component via this update route for simplicity
  // If changing KC is needed, it might require a separate mechanism or careful handling
  if (updateData.knowledge_component_id) {
      delete updateData.knowledge_component_id;
      // Optionally: return res.status(400).json({ error: 'Changing the Knowledge Component is not allowed via update.' });
  }

  try {
    // Find the content item and verify ownership
    const contentItem = await ContentItem.findOne({
      where: {
        id: contentItemId,
        teacher_id: teacherId // Check ownership
      }
    });

    if (!contentItem) {
      return res.status(404).json({ error: 'Content Item not found or you do not have permission to edit it.' });
    }

    // Perform the update
    const [affectedRows] = await ContentItem.update(updateData, {
      where: {
        id: contentItemId
        // No need for teacher_id here again as we already verified ownership
      }
    });

    if (affectedRows > 0) {
      const updatedContentItem = await ContentItem.findByPk(contentItemId); // Fetch updated data
      res.json({ message: 'Content Item updated successfully', contentItem: updatedContentItem });
    } else {
      res.json({ message: 'No changes detected.', contentItem: contentItem }); // Return current data
    }

  } catch (error) {
    console.error(`Error updating Content Item ID ${contentItemId}:`, error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to update content item.' });
  }
};

// Delete a Content Item owned by the teacher
exports.deleteContentItem = async (req, res) => {
  const teacherId = req.user.id;
  const contentItemId = parseInt(req.params.id, 10);

  if (isNaN(contentItemId)) {
    return res.status(400).json({ error: 'Invalid Content Item ID provided.' });
  }

  try {
    // Find the content item and verify ownership before deleting
    const contentItem = await ContentItem.findOne({
      where: {
        id: contentItemId,
        teacher_id: teacherId // Check ownership
      }
    });

    if (!contentItem) {
      return res.status(404).json({ error: 'Content Item not found or you do not have permission to delete it.' });
    }

    // Perform the delete
    await ContentItem.destroy({
      where: {
        id: contentItemId
        // No need for teacher_id here again as we already verified ownership
      }
    });

    res.status(200).json({ message: 'Content Item deleted successfully.' });

  } catch (error) {
    console.error(`Error deleting Content Item ID ${contentItemId}:`, error);
    // Handle potential foreign key constraint errors (e.g., if Responses depend on it and onDelete isn't set appropriately)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
       return res.status(400).json({ error: 'Cannot delete Content Item because it is associated with other data (e.g., Responses).' });
    }
    res.status(500).json({ error: 'Failed to delete content item.' });
  }
};

// Get content items created by the logged-in teacher
exports.getTeacherContentItems = async (req, res) => {
  try {
    // Ensure user is authenticated and is a teacher
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Optional: Add role check if needed, though middleware might handle this
    // if (req.user.role !== 'teacher') {
    //   return res.status(403).json({ error: 'Forbidden: Only teachers can access this resource' });
    // }

    const teacherId = req.user.id;

    const contentItems = await ContentItem.findAll({
      where: { teacher_id: teacherId },
      include: [{ // Include associated Knowledge Component details
        model: KnowledgeComponent,
        attributes: ['id', 'name', 'grade_level', 'curriculum_code'] // Specify needed attributes
      }],
      order: [['createdAt', 'DESC']] // Optional: order by creation date
    });

    res.json(contentItems);

  } catch (err) {
    console.error("Error fetching teacher's content items:", err);
    res.status(500).json({ error: 'Failed to fetch content items' });
  }
};

// Get students eligible to be added by the logged-in teacher
// NOTE: Basic implementation - fetches ALL students. Refine as needed.
exports.getEligibleStudents = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch all students - refine this logic later if needed (e.g., filter out already assigned students)
    const students = await Student.findAll({
      attributes: ['id', 'name', 'grade_level'], // Only send necessary fields
      order: [['name', 'ASC']]
    });

    res.json(students);

  } catch (err) {
    console.error("Error fetching eligible students:", err);
    res.status(500).json({ error: 'Failed to fetch eligible students' });
  }
};

// Get knowledge component mastery data across all classrooms for a teacher
exports.getTeacherKnowledgeComponentMastery = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id, 10);
    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Invalid Teacher ID' });
    }

    // 1. Get all classrooms for this teacher
    const classrooms = await db.Classroom.findAll({
      where: { teacher_id: teacherId },
      include: [{ model: db.Student, attributes: ['id'] }]
    });

    // 2. Get all knowledge components with more details
    const knowledgeComponents = await db.KnowledgeComponent.findAll({
      attributes: [
        'id', 
        'name', 
        'curriculum_code', 
        'description', 
        'grade_level',
        'metadata'
      ],
      raw: true
    });

    if (!knowledgeComponents.length) {
      return res.json([]);
    }

    // Extract all student IDs from classrooms
    const studentIds = classrooms.flatMap(classroom => 
      classroom.Students.map(student => student.id)
    );

    if (!studentIds.length) {
      // Return knowledge components with default values if no students
      return res.json(knowledgeComponents.map(kc => ({
        ...kc,
        averageMastery: 0,
        totalStudents: 0,
        totalContentItems: 0
      })));
    }

    // 3. Get knowledge states for all knowledge components for these students
    const knowledgeStates = await db.KnowledgeState.findAll({
      where: {
        student_id: { [db.Sequelize.Op.in]: studentIds },
        knowledge_component_id: { [db.Sequelize.Op.in]: knowledgeComponents.map(kc => kc.id) }
      },
      attributes: ['knowledge_component_id', 'student_id', 'p_mastery'],
      raw: true
    });

    // 4. Count content items related to each knowledge component
    const contentItems = await db.ContentItem.findAll({
      attributes: ['knowledge_component_id', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']],
      group: ['knowledge_component_id'],
      raw: true
    });

    // Create a map of content counts per KC
    const contentCountMap = {};
    contentItems.forEach(item => {
      contentCountMap[item.knowledge_component_id] = parseInt(item.count);
    });

    // 5. Calculate average mastery for each knowledge component
    const kcMasteryMap = {};
    const kcStudentsMap = {};

    knowledgeStates.forEach(state => {
      const kcId = state.knowledge_component_id;
      
      // Initialize mastery sum and student count for this KC if not already
      if (!kcMasteryMap[kcId]) {
        kcMasteryMap[kcId] = { sum: 0, count: 0 };
      }
      
      // Add mastery to sum and increment student count
      kcMasteryMap[kcId].sum += state.p_mastery;
      kcMasteryMap[kcId].count += 1;
      
      // Track unique students for this KC
      if (!kcStudentsMap[kcId]) {
        kcStudentsMap[kcId] = new Set();
      }
      kcStudentsMap[kcId].add(state.student_id);
    });

    // 6. Create result array with average mastery and other details
    const result = knowledgeComponents.map(kc => {
      const masteryData = kcMasteryMap[kc.id] || { sum: 0, count: 0 };
      const uniqueStudents = kcStudentsMap[kc.id] ? kcStudentsMap[kc.id].size : 0;
      const totalContentItems = contentCountMap[kc.id] || 0;
      
      // Parse metadata if it's a string
      let metadata = kc.metadata;
      try {
        if (typeof metadata === 'string') {
          metadata = JSON.parse(metadata);
        }
      } catch (e) {
        metadata = {};
      }
      
      // Extract difficulty from metadata
      const difficulty = metadata?.difficulty ? parseInt(metadata.difficulty) : 3;
      
      return {
        ...kc,
        metadata,
        difficulty,
        averageMastery: masteryData.count > 0 ? masteryData.sum / masteryData.count : 0,
        totalStudents: uniqueStudents,
        totalContentItems
      };
    });

    return res.json(result);

  } catch (error) {
    console.error('Error fetching teacher KC mastery:', error);
    return res.status(500).json({ error: 'Failed to retrieve knowledge component mastery data' });
  }
};

// Get content items for a specific knowledge component
exports.getKnowledgeComponentContent = async (req, res) => {
    try {
        const kcId = parseInt(req.params.id, 10);
        if (isNaN(kcId)) {
            return res.status(400).json({ error: 'Invalid Knowledge Component ID' });
        }

        // Get content items for this knowledge component
        const contentItems = await db.ContentItem.findAll({
            where: { knowledge_component_id: kcId },
            attributes: ['id', 'type', 'content', 'difficulty', 'options', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        // Get usage statistics for each content item
        const contentItemsWithStats = await Promise.all(contentItems.map(async (item) => {
            const responses = await db.Response.findAll({
                where: { content_item_id: item.id },
                attributes: ['id', 'time_spent']
            });

            const stats = {
                views: responses.length,
                averageTime: responses.length > 0 
                    ? responses.reduce((sum, r) => sum + (r.time_spent || 0), 0) / responses.length 
                    : 0
            };

            return {
                ...item.toJSON(),
                stats
            };
        }));

        res.json(contentItemsWithStats);
    } catch (error) {
        console.error('Error fetching knowledge component content:', error);
        res.status(500).json({ error: 'Failed to fetch knowledge component content' });
    }
};
