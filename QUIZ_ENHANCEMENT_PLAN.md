+++
id = "quiz-enhancement-plan"
title = "Quiz Enhancement Plan: Increasing Question Count from 5 to 8"
context_type = "planning"
scope = "Quiz system improvement"
target_audience = ["developers", "educators"]
granularity = "detailed"
status = "proposed"
last_updated = "2025-04-30"
tags = ["quiz", "assessment", "BKT", "mastery", "enhancement"]
+++

# Quiz Enhancement Plan: Increasing Question Count from 5 to 8

## Executive Summary

Based on analysis of the current ITS-KIDS quiz system, we recommend increasing the number of quiz questions from 5 to 8 per assessment. This change will improve the statistical reliability of mastery assessments while still maintaining student engagement, particularly for our target audience of elementary school students.

## Current Implementation Analysis

### Quiz Structure
- Quizzes currently contain exactly 5 questions (enforced in the frontend)
- The system uses Bayesian Knowledge Tracing (BKT) to calculate mastery
- Mastery threshold is set at 70% (0.7)

### Mastery Calculation Process
- Each response updates the student's knowledge state using the BKT algorithm
- The algorithm considers prior knowledge, learning probability, slip probability, and guess probability
- Time spent on questions and answer correctness influence mastery calculations

### Question Pool
- The system has diverse question types (multiple choice, fill-in-blank, computation, word problems)
- Questions have varying difficulty levels (1-5)
- Questions cover different mathematical concepts and skills

## Rationale for Increasing to 8 Questions

### Statistical Reliability
- Larger sample size (8 vs 5 questions) reduces variance in assessment results
- More data points for the BKT algorithm to make accurate mastery estimations
- Reduced impact of lucky guesses on overall mastery assessment

### Knowledge Component Coverage
- Additional questions allow for testing more aspects of each knowledge component
- Enables inclusion of questions with different difficulty levels
- Allows for a mix of question types to test different cognitive skills

### Balance with Student Engagement
- 8 questions is still manageable for elementary school students in a single session
- Not long enough to cause significant fatigue or disengagement
- Aligns with educational research recommendations for quiz length for this age group

## Required Code Changes

### Frontend Changes (QuizView.js)

1. Update the `totalQuestions` state initial value:
```javascript
const [totalQuestions, setTotalQuestions] = useState(8); // Change from 5 to 8
```

2. Modify the `MIN_QUIZ_LENGTH` constant in the `handleNext` function:
```javascript
const MIN_QUIZ_LENGTH = 8; // Change from 5 to 8
```

3. Update completion check logic:
```javascript
// Only show completion screen after 8 questions
if (questionNumber >= MIN_QUIZ_LENGTH) {
  console.log(`Reached minimum quiz length (${MIN_QUIZ_LENGTH} questions). Showing completion screen.`);
  // ... rest of completion handling ...
}
```

4. Update quiz summary calculation:
```javascript
setQuizSummary({
  totalQuestions: MIN_QUIZ_LENGTH,
  correctAnswers: correctAnswersCount,
  // ... rest of summary data ...
});
```

5. Update sequential quiz constants (if used):
```javascript
const FIXED_QUIZ_LENGTH = 8; // Change from 5 to 8
```

### Backend Changes (studentController.js)

1. Update the `QUIZ_LENGTH` constant:
```javascript
// FIXED QUIZ LENGTH - HARDCODED
const QUIZ_LENGTH = 8; // Change from 5 to 8
```

2. Modify the quiz completion status check:
```javascript
// Only mark as mastered/needs_review if we've reached question 8 or more
const quizCompletionStatus = {
  status: currentQuestionNumber >= 8 ?
          (hasMastery ? 'topic_mastered' : 'topic_needs_review') :
          'continue',
  // ... rest of status object ...
};
```

3. Update response JSON to client:
```javascript
res.status(201).json({
  // ... existing fields ...
  totalQuestions: 8 // QUIZ_LENGTH
});
```

### API Endpoint Changes (studentRoutes.js)

1. Increase limit for recommended content retrieval:
```javascript
// Find all eligible questions
const contentItems = await db.ContentItem.findAll({
  where: whereClause,
  include: [{
    model: db.KnowledgeComponent,
    attributes: ['id', 'curriculum_code']
  }],
  limit: 16, // Increase from 10 to at least 16 to ensure enough questions
  order: db.Sequelize.literal('RANDOM()') // Randomize the results
});
```

2. Update the return limit:
```javascript
// Return up to 16 items in an array
res.json(sortedItems.slice(0, 16));
```

## Additional Questions Implementation

To support 8-question quizzes, we need to ensure there are enough questions in the database for each knowledge component. We'll create a new seeder to add these additional questions.

### New Seeder File: `20250430000000-add-extended-quiz-questions.js`

1. Core structure (similar to existing seeders):
```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all knowledge components and teachers as in existing seeders
    
    // Define additional questions with varied types and difficulty
    const extendedQuizQuestions = [
      // Questions will be defined here
    ];
    
    // Create and insert content items
  },
  
  async down(queryInterface, Sequelize) {
    // Remove added questions
  }
};
```

2. Question types to include:
   - Multiple choice questions
   - Fill-in-blank questions
   - Computation problems
   - Word problems
   - Application questions

3. Distribution of questions by difficulty:
   - Easy (difficulty 1-2): 30%
   - Medium (difficulty 3): 40%
   - Challenging (difficulty 4-5): 30%

## User Experience Considerations

To maintain student engagement with longer quizzes:

1. **Progress Indicators**:
   - Update progress bar to clearly show progress through 8 questions
   - Add encouraging messages at the halfway point (after question 4)

2. **Visual Design**:
   - Consider adding visual rewards or animations after each set of 4 questions
   - Use varying visual elements to maintain interest

3. **Feedback Mechanisms**:
   - Ensure immediate, clear feedback after each question
   - Include more detailed explanations for incorrect answers

## Testing Strategy

### Technical Testing

1. **Unit Tests**:
   - Verify the BKT algorithm works correctly with more data points
   - Test the quiz completion logic with 8 questions

2. **Integration Tests**:
   - Test the flow from question 1 through 8
   - Verify mastery calculation after 8 questions
   - Test with both correct and incorrect answer patterns

3. **Edge Cases**:
   - Test with knowledge components that have limited questions
   - Test sequential navigation through all 8 questions
   - Test quiz resumption functionality (if implemented)

### User Testing

1. **Metrics to Monitor**:
   - Completion rates (do students finish all 8 questions?)
   - Time spent per question (does attention decrease in later questions?)
   - Correctness patterns (is performance consistent across all 8 questions?)

2. **Feedback Collection**:
   - Teacher observations of student engagement
   - Optional feedback form after quiz completion
   - A/B testing between 5 and 8 question formats (if feasible)

## Implementation Timeline

1. **Week 1: Development**
   - Day 1: Update backend constants and logic
   - Day 2: Update frontend components
   - Day 3-4: Create and implement new questions
   - Day 5: Initial testing and bug fixes

2. **Week 2: Testing and Refinement**
   - Day 1-2: Technical testing
   - Day 3-4: User testing with sample student group
   - Day 5: Refinements based on feedback

3. **Week 3: Deployment**
   - Day 1: Final review and approval
   - Day 2: Deployment to production
   - Day 3-5: Monitoring and immediate fixes if needed

## Conclusion

Increasing the quiz length from 5 to 8 questions strikes an optimal balance between assessment reliability and student engagement. This change will improve the accuracy of mastery determination while still keeping quizzes manageable for elementary school students.

The changes required are relatively straightforward, primarily involving constant updates and ensuring sufficient question availability. With proper implementation and testing, this enhancement should significantly improve the effectiveness of the ITS-KIDS assessment system.