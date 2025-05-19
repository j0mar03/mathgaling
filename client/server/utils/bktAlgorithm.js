/**
 * Bayesian Knowledge Tracing (BKT) Algorithm Implementation
 * 
 * This module implements the BKT algorithm for tracking student knowledge states.
 * 
 * BKT uses a Hidden Markov Model with the following parameters:
 * - p(L0): Initial probability of knowing the KC (prior knowledge)
 * - p(T): Probability of transitioning from not knowing to knowing the KC (learning)
 * - p(S): Probability of incorrect answer when student knows the KC (slip)
 * - p(G): Probability of correct answer when student doesn't know the KC (guess)
 */

const db = require('../models');
const { Op } = require('sequelize');

// Default BKT parameters
const DEFAULT_PARAMS = {
  // Initial probability of knowing the skill (prior)
  pL0: 0.3,
  // Probability of learning the skill when student doesn't know it
  pT: 0.09,
  // Probability of slip (incorrect answer when student knows the skill)
  pS: 0.1,
  // Probability of guess (correct answer when student doesn't know the skill)
  pG: 0.2
};

/**
 * Retrieves BKT parameters for a specific knowledge component
 * @param {number} kcId - Knowledge component ID
 * @returns {Object} - BKT parameters
 */
const getBktParams = async (kcId) => {
  try {
    // Try to get custom parameters for the KC from database
    const kc = await db.KnowledgeComponent.findByPk(kcId);
    
    // Check if KC has custom BKT parameters
    if (kc && kc.metadata && kc.metadata.bktParams) {
      return {
        pL0: kc.metadata.bktParams.pL0 ?? DEFAULT_PARAMS.pL0,
        pT: kc.metadata.bktParams.pT ?? DEFAULT_PARAMS.pT,
        pS: kc.metadata.bktParams.pS ?? DEFAULT_PARAMS.pS,
        pG: kc.metadata.bktParams.pG ?? DEFAULT_PARAMS.pG
      };
    }
    
    // Return default parameters if no custom ones exist
    return { ...DEFAULT_PARAMS };
  } catch (error) {
    console.error(`Error retrieving BKT parameters for KC ${kcId}:`, error);
    return { ...DEFAULT_PARAMS };
  }
};

/**
 * Calculates the probability of student knowing the KC based on the current estimate and the correctness of the answer
 * @param {Object} params - BKT parameters
 * @param {number} pLn - Current probability estimate that student knows the KC
 * @param {boolean} correct - Whether the student answered correctly
 * @returns {number} - Updated probability estimate
 */
const updateKnowledgeProbability = (params, pLn, correct) => {
  // Step 1: Calculate p(L|correct) or p(L|incorrect) using Bayes' rule
  let pLnGivenEvidence;
  
  if (correct) {
    // Formula for correct answer: p(L|correct) = p(L) * (1-p(S)) / [p(L) * (1-p(S)) + (1-p(L)) * p(G)]
    const numerator = pLn * (1 - params.pS);
    const denominator = numerator + (1 - pLn) * params.pG;
    pLnGivenEvidence = numerator / denominator;
  } else {
    // Formula for incorrect answer: p(L|incorrect) = p(L) * p(S) / [p(L) * p(S) + (1-p(L)) * (1-p(G))]
    const numerator = pLn * params.pS;
    const denominator = numerator + (1 - pLn) * (1 - params.pG);
    pLnGivenEvidence = numerator / denominator;
  }
  
  // Step 2: Account for learning that might have happened (transition)
  // p(L|n+1) = p(L|evidence) + (1 - p(L|evidence)) * p(T)
  const pLnPlus1 = pLnGivenEvidence + (1 - pLnGivenEvidence) * params.pT;
  
  return pLnPlus1;
};

/**
 * Gets the current knowledge state for a student on a KC
 * @param {number} studentId - Student ID
 * @param {number} kcId - Knowledge component ID
 * @returns {Promise<Object>} - Knowledge state object
 */
const getKnowledgeState = async (studentId, kcId) => {
  try {
    let state = await db.KnowledgeState.findOne({
      where: {
        student_id: studentId,
        knowledge_component_id: kcId
      }
    });
    
    if (!state) {
      // Initialize with default parameters if no state exists
      const params = await getBktParams(kcId);
      state = await db.KnowledgeState.create({
        student_id: studentId,
        knowledge_component_id: kcId,
        p_mastery: params.pL0,
        p_transit: params.pT,
        p_slip: params.pS,
        p_guess: params.pG,
        last_update: new Date()
      });
    }
    
    return state;
  } catch (error) {
    console.error(`Error getting knowledge state for student ${studentId}, KC ${kcId}:`, error);
    throw error;
  }
};

/**
 * Updates the knowledge state after a student response
 * @param {number} studentId - Student ID
 * @param {number} contentItemId - Content item ID
 * @param {boolean} correct - Whether the response was correct
 * @param {number} timeSpent - Time spent on the question (optional, used for fuzzy adjustments)
 * @param {Object} interactionData - Additional data about the interaction (optional, for hints/attempts)
 * @returns {Promise<Object>} - Updated knowledge state
 */
const updateKnowledgeState = async (studentId, contentItemId, correct, timeSpent = null, interactionData = null) => {
  // Add recent performance data to interactionData if not already present
  if (interactionData && !interactionData.recentPerformance) {
    try {
      // Get recent responses for this student
      const recentResponses = await db.Response.findAll({
        where: {
          student_id: studentId,
          createdAt: {
            [db.Sequelize.Op.gt]: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
          }
        },
        limit: 10,
        order: [['createdAt', 'DESC']]
      });
      
      if (recentResponses.length > 0) {
        const correctResponses = recentResponses.filter(r => r.correct).length;
        const correctRate = correctResponses / recentResponses.length;
        
        // Count consecutive correct answers
        let consecutiveCorrect = 0;
        for (const response of recentResponses) {
          if (response.correct) {
            consecutiveCorrect++;
          } else {
            break;
          }
        }
        
        // Get the content item to find the associated KC
        const contentItem = await db.ContentItem.findByPk(contentItemId);
        const kcId = contentItem.knowledge_component_id;
        
        // Check for good performance across multiple sessions
        const pastDayResponses = await db.Response.findAll({
          where: {
            student_id: studentId,
            content_item_id: {
              [db.Sequelize.Op.in]: [
                db.Sequelize.literal(`SELECT id FROM content_items WHERE knowledge_component_id = ${kcId}`)
              ]
            },
            createdAt: {
              [db.Sequelize.Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          order: [['createdAt', 'DESC']]
        });
        
        // Group responses into sessions (30-minute gaps)
        const sessions = [];
        let currentSession = [];
        let lastResponseTime = null;
        
        for (const response of pastDayResponses) {
          if (lastResponseTime &&
              (new Date(response.createdAt) - new Date(lastResponseTime)) > 30 * 60 * 1000) {
            // More than 30 minutes gap, start a new session
            if (currentSession.length > 0) {
              sessions.push(currentSession);
              currentSession = [];
            }
          }
          
          currentSession.push(response);
          lastResponseTime = response.createdAt;
        }
        
        // Add the last session if it exists
        if (currentSession.length > 0) {
          sessions.push(currentSession);
        }
        
        // Count sessions with good performance (>70% correct)
        const sessionsWithGoodPerformance = sessions.filter(session => {
          const sessionCorrect = session.filter(r => r.correct).length;
          return session.length >= 3 && (sessionCorrect / session.length) >= 0.7;
        }).length;
        
        // Add performance data to interactionData
        interactionData.recentPerformance = {
          correctRate: correctRate,
          totalResponses: recentResponses.length,
          correctResponses: correctResponses,
          consecutiveCorrect: consecutiveCorrect,
          sessionsWithGoodPerformance: sessionsWithGoodPerformance
        };
        
        console.log(`Recent performance: ${correctResponses}/${recentResponses.length} correct (${(correctRate * 100).toFixed(0)}%)`);
        console.log(`Consecutive correct answers: ${consecutiveCorrect}`);
        console.log(`Sessions with good performance: ${sessionsWithGoodPerformance}`);
      }
    } catch (err) {
      console.error("Error calculating recent performance:", err);
      // Continue without recent performance data
    }
  }
  try {
    // Get the content item to find the associated KC
    const contentItem = await db.ContentItem.findByPk(contentItemId);
    if (!contentItem) {
      throw new Error(`Content item ${contentItemId} not found`);
    }
    
    const kcId = contentItem.knowledge_component_id;
    
    // Get the current knowledge state
    const knowledgeState = await getKnowledgeState(studentId, kcId);
    const currentMastery = knowledgeState.p_mastery || 0.3; // Default if null
    
    // Get BKT parameters for this KC
    const params = await getBktParams(kcId);
    
    // Update mastery estimate using BKT
    let newMastery = updateKnowledgeProbability(params, currentMastery, correct);
    
    // Apply fuzzy logic adjustments based on time spent and interaction data (if provided)
    if (timeSpent !== null) {
      newMastery = applyFuzzyAdjustments(newMastery, correct, timeSpent, contentItem.difficulty || 3, interactionData);
    }
        
    // Update the knowledge state in the database
    await knowledgeState.update({
      p_mastery: newMastery,
      last_update: new Date()
    });
    
    // Record this response
    await db.Response.create({
      student_id: studentId,
      content_item_id: contentItemId,
      correct: correct,
      time_spent: timeSpent
    });
    
    return {
      studentId,
      kcId,
      previousMastery: currentMastery,
      newMastery: newMastery,
      masteryChange: newMastery - currentMastery,
      contentItemId
    };
  } catch (error) {
    console.error('Error updating knowledge state:', error);
    throw error;
  }
};

/**
 * Applies fuzzy logic adjustments to mastery based on response time, difficulty, and hints/attempts
 * @param {number} mastery - Current mastery estimate
 * @param {boolean} correct - Whether the response was correct
 * @param {number} timeSpent - Time spent on the question (seconds)
 * @param {number} difficulty - Question difficulty (1-5)
 * @param {Object} interactionData - Additional data about the interaction (optional)
 * @returns {number} - Adjusted mastery
 */
const applyFuzzyAdjustments = (mastery, correct, timeSpent, difficulty, interactionData = null) => {
  // Define fuzzy membership functions for time spent
  // These thresholds would ideally be calibrated based on data
  const expectedTime = 10 * difficulty; // Simple heuristic: 10 seconds per difficulty level
  const timeRatio = timeSpent / expectedTime;
  
  // Fuzzy adjustment factors
  let adjustment = 0;
  
  // Time-based adjustments
  if (correct) {
    if (timeRatio < 0.5) {
      // Very fast correct answer: strong positive adjustment
      adjustment = 0.05;
    } else if (timeRatio < 0.8) {
      // Fast correct answer: moderate positive adjustment
      adjustment = 0.025;
    } else if (timeRatio > 2.0) {
      // Very slow correct answer: slight negative adjustment
      adjustment = -0.01;
    }
  } else {
    if (timeRatio < 0.5) {
      // Very fast incorrect answer: strong negative adjustment (likely careless error)
      adjustment = -0.05;
    } else if (timeRatio > 2.0) {
      // Very slow incorrect answer: lesser negative adjustment (shows effort)
      adjustment = -0.015;
    } else {
      // Normal time incorrect answer: moderate negative adjustment
      adjustment = -0.03;
    }
  }
  
  // Hints/attempts-based adjustments
  if (interactionData) {
    const hintsUsed = interactionData.hintsUsed || interactionData.hintRequests || 0;
    const attempts = interactionData.attempts || 1;
    
    // Adjust based on hints used
    if (correct) {
      if (hintsUsed > 0) {
        // Reduce positive adjustment if hints were used
        const hintPenalty = Math.min(0.01 * hintsUsed, 0.03);
        adjustment -= hintPenalty;
      }
    }
    
    // Adjust based on number of attempts
    if (correct && attempts > 1) {
      // Reduce positive adjustment for multiple attempts
      const attemptPenalty = Math.min(0.01 * (attempts - 1), 0.03);
      adjustment -= attemptPenalty;
    }
    
    // Check for recent quiz performance data
    if (interactionData.recentPerformance) {
      const correctRate = interactionData.recentPerformance.correctRate || 0;
      
      // If recent performance is poor, apply a stronger negative adjustment
      if (correctRate < 0.6) { // Less than 60% correct
        const performancePenalty = 0.05 * (1 - correctRate); // Higher penalty for worse performance
        console.log(`Applying performance penalty: -${(performancePenalty * 100).toFixed(2)}% due to poor quiz performance (${(correctRate * 100).toFixed(0)}%)`);
        adjustment -= performancePenalty;
      }
    }
  }
  
  // Apply adjustment with bounds check (0-1)
  const adjustedMastery = Math.max(0, Math.min(1, mastery + adjustment));
  
  // Ensure mastery doesn't exceed 0.8 (80%) unless performance is consistently good
  const masteryThreshold = 0.8;
  if (adjustedMastery >= masteryThreshold) {
    // Only allow mastery to exceed threshold if:
    // 1. It was already above threshold before adjustment, or
    // 2. Recent performance data shows good performance, or
    // 3. Student has demonstrated consistent performance across sessions
    
    // Check for consecutive correct answers (at least 3)
    const hasConsecutiveCorrect = interactionData?.recentPerformance?.consecutiveCorrect >= 3;
    
    // Check for performance across multiple sessions
    const hasMultiSessionMastery = interactionData?.recentPerformance?.sessionsWithGoodPerformance >= 2;
    
    const allowHighMastery =
      mastery >= masteryThreshold ||
      (interactionData?.recentPerformance?.correctRate >= 0.7) ||
      hasConsecutiveCorrect ||
      hasMultiSessionMastery;
    
    if (!allowHighMastery) {
      console.log(`Capping mastery at ${masteryThreshold * 100}% until consistent good performance is demonstrated`);
      return masteryThreshold - 0.01; // Just below threshold
    }
  }
  
  return adjustedMastery;
};

/**
 * Finds the next best content item for a student based on knowledge state
 * @param {number} studentId - Student ID
 * @param {number} kcId - Knowledge component ID
 * @returns {Promise<Object>} - Next recommended content item
 */
const recommendNextContent = async (studentId, kcId) => {
  try {
    // Get current knowledge state
    const knowledgeState = await getKnowledgeState(studentId, kcId);
    const currentMastery = knowledgeState.p_mastery || 0.3;
    
    // Get all content items for this KC
    const contentItems = await db.ContentItem.findAll({
      where: { knowledge_component_id: kcId }
    });
    
    if (contentItems.length === 0) {
      return null;
    }
    
    // Get previous responses to avoid recommending recently seen items
    const recentResponses = await db.Response.findAll({
      where: {
        student_id: studentId,
        content_item_id: {
          [Op.in]: contentItems.map(item => item.id)
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    const recentItemIds = new Set(recentResponses.map(r => r.content_item_id));
    
    // Calculate appropriate difficulty based on current mastery
    const targetDifficulty = Math.ceil(currentMastery * 5);
    
    // Score each content item based on how appropriate it is
    const scoredItems = contentItems.map(item => {
      // Start with a base score
      let score = 10;
      
      // Penalize recently seen items
      if (recentItemIds.has(item.id)) {
        score -= 5;
      }
      
      // Score based on difficulty match (higher score = better match)
      const difficultyDiff = Math.abs((item.difficulty || 3) - targetDifficulty);
      score -= difficultyDiff * 2;
      
      return {
        contentItem: item,
        score
      };
    });
    
    // Sort by score (highest first) and return the best item
    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems[0].contentItem;
  } catch (error) {
    console.error(`Error recommending content for student ${studentId}, KC ${kcId}:`, error);
    throw error;
  }
};

module.exports = {
  updateKnowledgeState,
  getKnowledgeState,
  recommendNextContent,
  getBktParams
};
