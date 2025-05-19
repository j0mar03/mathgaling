+++
id = "quiz-implementation-guide"
title = "Implementation Guide: 8-Question Quiz Format"
context_type = "planning"
scope = "Code modification instructions"
target_audience = ["developers"]
granularity = "detailed"
status = "proposed"
last_updated = "2025-04-30"
tags = ["quiz", "implementation", "code-changes", "frontend", "backend"]
+++

# Implementation Guide: 8-Question Quiz Format

This document provides detailed instructions for updating the ITS-KIDS system to support 8-question quizzes instead of the current 5-question format.

## Overview of Changes

The implementation requires modifications to both frontend and backend code:

1. **Frontend**: Update the QuizView component to handle 8 questions
2. **Backend**: Modify the student controller and routes to support longer quizzes
3. **Database**: Add more quiz questions (covered in separate document)

## Implementation Steps

### 1. Backend Changes

#### A. Update StudentController.js

1. Update the quiz length constant:

```javascript
// Before
const QUIZ_LENGTH = 5;

// After
const QUIZ_LENGTH = 8;
```

2. Modify the quiz completion status check:

```javascript
// Before
const quizCompletionStatus = {
  status: currentQuestionNumber >= 5 ?
          (hasMastery ? 'topic_mastered' : 'topic_needs_review') :
          'continue',
  // ...other properties...
};

// After
const quizCompletionStatus = {
  status: currentQuestionNumber >= 8 ?
          (hasMastery ? 'topic_mastered' : 'topic_needs_review') :
          'continue',
  // ...other properties...
};
```

3. Update the response JSON:

```javascript
// Before
res.status(201).json({
  // ...other properties...
  totalQuestions: 5 // QUIZ_LENGTH
});

// After
res.status(201).json({
  // ...other properties...
  totalQuestions: 8 // QUIZ_LENGTH
});
```

#### B. Update StudentRoutes.js

1. Increase the limit for fetching recommended content items:

```javascript
// Before
const contentItems = await db.ContentItem.findAll({
  where: whereClause,
  include: [{
    model: db.KnowledgeComponent,
    attributes: ['id', 'curriculum_code']
  }],
  limit: 10, // Increase limit to ensure we have enough questions
  order: db.Sequelize.literal('RANDOM()') // Randomize the results
});

// After
const contentItems = await db.ContentItem.findAll({
  where: whereClause,
  include: [{
    model: db.KnowledgeComponent,
    attributes: ['id', 'curriculum_code']
  }],
  limit: 16, // Increased to ensure we have enough questions for 8-question quizzes
  order: db.Sequelize.literal('RANDOM()') // Randomize the results
});
```

2. Update the return number of items:

```javascript
// Before
// Return up to 10 items in an array (the frontend will use the first one)
// This ensures we have enough questions for a complete 5-question quiz
res.json(sortedItems.slice(0, 10));

// After
// Return up to 16 items in an array (the frontend will use the first one)
// This ensures we have enough questions for a complete 8-question quiz
res.json(sortedItems.slice(0, 16));
```

### 2. Frontend Changes

#### A. Update QuizView.js

1. Update the initial totalQuestions state:

```javascript
// Before
const [totalQuestions, setTotalQuestions] = useState(5); // Total questions in quiz

// After
const [totalQuestions, setTotalQuestions] = useState(8); // Total questions in quiz
```

2. Update the fixed quiz length constant in handleNext function:

```javascript
// Before
// IMPORTANT: We're now enforcing a strict minimum of 5 questions
// regardless of what the backend says
const MIN_QUIZ_LENGTH = 5;

// After
// IMPORTANT: We're now enforcing a strict minimum of 8 questions
// regardless of what the backend says
const MIN_QUIZ_LENGTH = 8;
```

3. Update the sequential quiz constants:

```javascript
// Before
// Calculate quiz summary with the current correct answers count
// Use a fixed length of 5 questions for consistency
const FIXED_QUIZ_LENGTH = 5;

// After
// Calculate quiz summary with the current correct answers count
// Use a fixed length of 8 questions for consistency
const FIXED_QUIZ_LENGTH = 8;
```

4. Update the quiz progress UI to reflect 8 questions.

Locate the progress indicator in the render section:

```jsx
// Before
<div className="quiz-progress">
  Question {questionNumber} of {totalQuestions}
</div>

// After - Keep the same structure but the values will reflect 8 questions
<div className="quiz-progress">
  Question {questionNumber} of {totalQuestions}
</div>
```

5. Update any hardcoded references to question counts in the UI:

```jsx
// Before (if any)
<p>Complete all 5 questions to finish this quiz.</p>

// After
<p>Complete all 8 questions to finish this quiz.</p>
```

## Implementation Sequence

For a smooth implementation, follow this sequence:

1. **First Phase: Backend Updates**
   - Update StudentController.js constants
   - Update StudentRoutes.js query limits
   - Test backend changes by making API calls directly

2. **Second Phase: Frontend Updates**
   - Update QuizView.js constants and UI
   - Test the quiz flow with the updated frontend

3. **Third Phase: Data Preparation**
   - Implement new quiz questions using the seeder
   - Verify question diversity and coverage

4. **Fourth Phase: Integration Testing**
   - Test complete quiz flows with 8 questions
   - Verify mastery calculation and completion status

## Testing Plan

### Backend Testing

1. Test the `/api/students/:id/recommended-content` endpoint:
   - Verify it returns up to 16 items
   - Check that items are properly randomized
   - Validate that items belong to appropriate knowledge components

2. Test the `/api/students/:id/responses` endpoint:
   - Submit 8 sequential responses
   - Verify mastery calculation works correctly
   - Check that quiz completion status changes appropriately after 8 questions

### Frontend Testing

1. Test Quiz Navigation:
   - Start a new quiz and verify it shows "Question 1 of 8"
   - Answer questions sequentially and check the counter increases correctly
   - Verify that 8 different questions are presented

2. Test Quiz Completion:
   - Complete all 8 questions and verify the completion screen displays
   - Check that mastery information is displayed correctly
   - Test the "Try Again" and "Return to Dashboard" functionality

3. Test Edge Cases:
   - Start a quiz with limited available questions
   - Check behavior when incorrect answers are provided
   - Test with different mastery levels (high, medium, low)

## User Experience Considerations

1. **Progress Indicators**: 
   - The progress bar should clearly show 8 steps
   - Consider adding a mid-quiz encouragement message after question 4

2. **Engagement Techniques**:
   - Add visual variety to maintain interest through 8 questions
   - Consider adding a brief animation after question 4 as a "halfway point" celebration

3. **Completion Rewards**:
   - Enhance the completion animation/feedback for finishing all 8 questions
   - Consider adding a "stamina bonus" for completing the longer quiz

## Rollback Plan

If issues arise with the 8-question format:

1. **Quick Rollback**:
   - Revert the constants to 5 questions in both frontend and backend
   - Leave the additional questions in the database (they won't cause issues)

2. **Monitoring Metrics**:
   - Track quiz completion rates before and after the change
   - Monitor time spent per question to detect fatigue
   - Track overall mastery assessment changes

## Next Steps After Implementation

1. **Monitor Usage**:
   - Track completion rates for 8-question quizzes
   - Compare mastery assessment accuracy with historical data

2. **Gather Feedback**:
   - Collect teacher feedback on student engagement
   - Gather student feedback on quiz length

3. **Potential Future Enhancements**:
   - Consider adaptive quiz length based on performance
   - Add mid-quiz encouragement features
   - Implement "save progress" functionality for longer quizzes