# Intelligent Tutoring System: BKT Algorithm Implementation

This document explains the Bayesian Knowledge Tracing (BKT) algorithm implemented in the MathGaling intelligent tutoring system, including how the algorithm works, the formulas used, how interventions are determined, and the adaptive components of the system.

## 1. Overview of Bayesian Knowledge Tracing (BKT)

Bayesian Knowledge Tracing is a cognitive modeling method used to estimate a student's knowledge state based on their performance history. The implementation in MathGaling uses an enhanced BKT model with fuzzy logic adjustments to provide timely interventions and adaptive learning.

### Core BKT Parameters

The standard BKT model uses four key parameters:

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| p(L₀) | Initial probability of knowing the KC (prior knowledge) | 0.3 |
| p(T) | Probability of transitioning from not knowing to knowing (learning) | 0.09 |
| p(G) | Probability of guessing correctly when not knowing (guess) | 0.2 |
| p(S) | Probability of answering incorrectly when knowing (slip) | 0.1 |

These parameters can be customized for each Knowledge Component (KC) in the system, allowing for domain-specific fine-tuning.

## 2. BKT Mathematical Model

### Basic BKT Update Formula

The BKT algorithm uses Bayes' theorem to update the probability that a student knows a KC after each observation (correct or incorrect response).

#### Step 1: Evidence Update (Posterior)
When a student gives a correct answer:
```
P(L|correct) = P(L) * (1 - P(S)) / [P(L) * (1 - P(S)) + (1 - P(L)) * P(G)]
```

When a student gives an incorrect answer:
```
P(L|incorrect) = P(L) * P(S) / [P(L) * P(S) + (1 - P(L)) * (1 - P(G))]
```

#### Step 2: Learning Update (Transition)
After incorporating the evidence, the probability is updated to account for learning:
```
P(L_{n+1}) = P(L|evidence) + (1 - P(L|evidence)) * P(T)
```

### Implementation in Code

The core update function is implemented in `updateKnowledgeProbability()`:

```javascript
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
```

## 3. Enhanced BKT with Fuzzy Logic

The standard BKT model has been enhanced with fuzzy logic adjustments that take into account additional information:

### Adjustment Factors

1. **Response Time**: How quickly the student answers relative to the expected time:
   - Fast correct answers → Strong positive adjustment (+0.05)
   - Fast incorrect answers → Strong negative adjustment (-0.05)
   - Very slow correct answers → Slight negative adjustment (-0.01)
   - Very slow incorrect answers → Lesser negative adjustment (-0.015)

2. **Hint Usage**: Penalizes mastery when hints are used:
   - Each hint used reduces the positive adjustment (up to -0.03)

3. **Multiple Attempts**: Multiple attempts to solve reduce mastery gain:
   - Each additional attempt reduces positive adjustment (up to -0.03)

4. **Recent Performance**: Overall pattern of recent answers:
   - Poor recent performance (< 60% correct) applies additional penalty scaled by performance

5. **Multi-Session Performance**: Performance across learning sessions:
   - Good performance across multiple sessions required for high mastery

### Fuzzy Adjustment Implementation

The fuzzy adjustments are applied using the `applyFuzzyAdjustments()` function:

```javascript
const applyFuzzyAdjustments = (mastery, correct, timeSpent, difficulty, interactionData = null) => {
  // Define fuzzy membership functions for time spent
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
  
  // Additional adjustments for hints, attempts, and recent performance
  // [implementation details...]
  
  // Apply mastery cap of 0.8 unless student has shown consistent good performance
  const masteryThreshold = 0.8;
  if (adjustedMastery >= masteryThreshold) {
    // Special conditions to allow mastery > 0.8
    const hasConsecutiveCorrect = interactionData?.recentPerformance?.consecutiveCorrect >= 3;
    const hasMultiSessionMastery = interactionData?.recentPerformance?.sessionsWithGoodPerformance >= 2;
    
    const allowHighMastery =
      mastery >= masteryThreshold ||
      (interactionData?.recentPerformance?.correctRate >= 0.7) ||
      hasConsecutiveCorrect ||
      hasMultiSessionMastery;
    
    if (!allowHighMastery) {
      return masteryThreshold - 0.01; // Just below threshold
    }
  }
  
  return adjustedMastery;
};
```

## 4. Timely Intervention System

The system determines when and how to intervene based on several factors:

### Mastery-Based Interventions

1. **Mastery Thresholds**:
   - p_mastery < 0.3: Beginner level interventions (more scaffolding)
   - 0.3 ≤ p_mastery < 0.7: Intermediate interventions (targeted practice)
   - p_mastery ≥ 0.7: Advanced interventions (challenging content)

2. **Special Mastery Cap at 0.8**:
   - The system caps mastery at 0.8 unless the student demonstrates:
     - At least 3 consecutive correct answers, OR
     - Good performance (>70% correct) in at least 2 different sessions
   - This ensures mastery is demonstrated over time, not just in one session

### Adaptive Content Selection

The system selects appropriate content based on the student's current knowledge state:

```javascript
// Calculating appropriate difficulty based on current mastery
const targetDifficulty = Math.ceil(currentMastery * 5);

// Time-based thresholds adjusted by difficulty
const expectedTime = 10 * difficulty; // Simple heuristic: 10 seconds per difficulty level
```

When recommending content, the system:
1. Determines target difficulty based on mastery level (scale of 1-5)
2. Avoids recently seen content to ensure variety
3. Uses content scoring to match student needs:
   ```javascript
   // Score each content item
   let score = 10;
   // Penalize recently seen items
   if (recentItemIds.has(item.id)) {
     score -= 5;
   }
   // Score based on difficulty match
   const difficultyDiff = Math.abs((item.difficulty || 3) - targetDifficulty);
   score -= difficultyDiff * 2;
   ```

### Kid-Friendly Adaptations

For younger students, interventions are presented in a more friendly way:

```javascript
// Kid-friendly difficulty descriptions
const difficulty = masteryPercentage < 30 ? "easy" :
                  masteryPercentage < 70 ? "medium" : "challenging";

// Kid-friendly mastery messages
const description = masteryPercentage < 30 ? "Let's learn something new!" :
                   masteryPercentage < 70 ? "Let's practice more!" :
                   "Let's master this!";
```

## 5. Session Analysis for Learning Evidence

The system tracks learning across multiple sessions to ensure genuine mastery:

```javascript
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

// Count sessions with good performance (>70% correct)
const sessionsWithGoodPerformance = sessions.filter(session => {
  const sessionCorrect = session.filter(r => r.correct).length;
  return session.length >= 3 && (sessionCorrect / session.length) >= 0.7;
}).length;
```

This analysis allows the system to determine if a student has demonstrated knowledge over time (spacing effect), rather than just within a single session.

## 6. Conclusion

The MathGaling intelligent tutoring system uses an enhanced BKT algorithm that goes beyond the standard approach by incorporating:

1. **Fuzzy Logic Adjustments** - Account for time spent, hints used, and attempt patterns
2. **Multi-Session Mastery** - Require demonstrated knowledge across time (spaced learning)
3. **Adaptive Difficulty** - Match content difficulty to current mastery level
4. **Kid-Friendly Interventions** - Present appropriate challenge levels with motivating language

This comprehensive approach ensures:
- Timely interventions when students are struggling
- Appropriate challenge level based on current knowledge
- Accurate assessment of genuine mastery across multiple sessions
- Personalized learning experiences with adaptive content selection

The combination of BKT's statistical model with fuzzy logic enhancements creates a robust system that can accurately track student knowledge and provide the right support at the right time.