+++
id = "quiz-seeder-specification"
title = "Extended Quiz Questions Seeder Specification"
context_type = "planning"
scope = "Implementation guide for additional quiz questions"
target_audience = ["developers"]
granularity = "detailed"
status = "proposed"
last_updated = "2025-04-30"
tags = ["quiz", "seeder", "questions", "implementation"]
+++

# Extended Quiz Questions Seeder Specification

## Overview

This document provides the detailed specification for implementing a new seeder file to add additional quiz questions to the ITS-KIDS system. These questions will support the expansion of quiz length from 5 to 8 questions.

## File Information

- **Filename**: `20250430000000-add-extended-quiz-questions.js`
- **Location**: `client/server/seeders/`
- **Purpose**: Add at least 40 new questions across all knowledge components

## Implementation Details

### File Structure

The seeder file should follow the standard Sequelize migration pattern:

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Implementation here
  },

  async down(queryInterface, Sequelize) {
    // Rollback implementation here
  }
};
```

### Core Logic

1. Retrieve existing knowledge components and teachers
2. Define new questions with varied types and difficulty levels
3. Assign questions to knowledge components
4. Insert questions into the database

### Question Array

Include at least 40 new questions distributed across different mathematical concepts:

#### Number Concepts and Operations (10 questions)

```javascript
// Addition & Subtraction
{
  content: 'If you have 127 stickers and give away 39, how many stickers do you have left?',
  type: 'computation',
  difficulty: 3,
  metadata: {
    answer: '88',
    hint: 'Subtract 39 from 127',
    explanation: '127 - 39 = 88',
    question_type: 'fill_in_blank'
  }
},
{
  content: 'Miguel had 35 marbles. He gave 12 to his friend and then got 8 more from his sister. How many marbles does Miguel have now?',
  type: 'word_problem',
  difficulty: 2,
  metadata: {
    answer: '31',
    hint: 'First subtract the marbles he gave away, then add the new ones',
    explanation: '35 - 12 = 23, then 23 + 8 = 31',
    question_type: 'fill_in_blank'
  }
},

// Multiplication & Division
{
  content: 'A store sells notebooks in packages of 6. How many notebooks are in 7 packages?',
  type: 'multiple_choice',
  difficulty: 2,
  metadata: {
    answer: '42',
    choices: ['36', '42', '48', '54'],
    hint: 'Multiply the number of notebooks in each package by the number of packages',
    explanation: '6 × 7 = 42',
    question_type: 'multiple_choice'
  }
},
{
  content: 'If 48 students are divided equally into 6 groups, how many students are in each group?',
  type: 'computation',
  difficulty: 2,
  metadata: {
    answer: '8',
    hint: 'Divide the total number of students by the number of groups',
    explanation: '48 ÷ 6 = 8',
    question_type: 'fill_in_blank'
  }
},

// Place Value & Rounding
{
  content: 'Round 3,742 to the nearest hundred.',
  type: 'multiple_choice',
  difficulty: 3,
  metadata: {
    answer: '3,700',
    choices: ['3,700', '3,740', '3,750', '3,800'],
    hint: 'Look at the tens digit to determine if you round up or down',
    explanation: 'The tens digit is 4, which is less than 5, so we round down to 3,700',
    question_type: 'multiple_choice'
  }
},
```

#### Fractions and Decimals (10 questions)

```javascript
// Understanding Fractions
{
  content: 'What fraction of the shape is shaded? [Image shows 3 out of 4 parts shaded]',
  type: 'multiple_choice',
  difficulty: 1,
  metadata: {
    answer: '3/4',
    choices: ['1/4', '2/4', '3/4', '4/3'],
    hint: 'Count the total parts and the shaded parts',
    explanation: 'There are 4 total parts, and 3 are shaded. So the fraction is 3/4',
    question_type: 'multiple_choice'
  }
},
{
  content: 'Which fraction is equivalent to 6/8?',
  type: 'multiple_choice',
  difficulty: 3,
  metadata: {
    answer: '3/4',
    choices: ['1/2', '2/3', '3/4', '7/9'],
    hint: 'Divide both the numerator and denominator by their greatest common factor',
    explanation: 'The greatest common factor of 6 and 8 is 2. Dividing both by 2: 6÷2=3, 8÷2=4, so 6/8 = 3/4',
    question_type: 'multiple_choice'
  }
},

// Decimal Concepts
{
  content: 'Write 0.75 as a fraction.',
  type: 'multiple_choice',
  difficulty: 3,
  metadata: {
    answer: '3/4',
    choices: ['3/4', '7/5', '75/10', '75/100'],
    hint: 'Remember that 0.75 = 75/100, then simplify',
    explanation: '0.75 = 75/100. The greatest common factor of 75 and 100 is 25. Dividing both by 25: 75÷25=3, 100÷25=4, so 75/100 = 3/4',
    question_type: 'multiple_choice'
  }
},
{
  content: 'What is 3.7 + 2.45?',
  type: 'computation',
  difficulty: 2,
  metadata: {
    answer: '6.15',
    hint: 'Line up the decimal points and add',
    explanation: 'Adding 3.70 + 2.45 = 6.15',
    question_type: 'fill_in_blank'
  }
},
```

#### Geometry (5 questions)

```javascript
// Area and Perimeter
{
  content: 'What is the area of a rectangle with length 8 cm and width 5 cm?',
  type: 'computation',
  difficulty: 2,
  metadata: {
    answer: '40',
    hint: 'Area of rectangle = length × width',
    explanation: 'Area = 8 cm × 5 cm = 40 cm²',
    question_type: 'fill_in_blank'
  }
},
{
  content: 'Find the perimeter of a square with sides of 7 meters each.',
  type: 'multiple_choice',
  difficulty: 2,
  metadata: {
    answer: '28',
    choices: ['14', '21', '28', '49'],
    hint: 'Perimeter = sum of all sides',
    explanation: 'Perimeter = 4 × 7 meters = 28 meters',
    question_type: 'multiple_choice'
  }
},
```

#### Measurement (5 questions)

```javascript
// Time
{
  content: 'How many minutes are in 2.5 hours?',
  type: 'computation',
  difficulty: 2,
  metadata: {
    answer: '150',
    hint: 'Multiply hours by 60 to get minutes',
    explanation: '2.5 hours = 2.5 × 60 minutes = 150 minutes',
    question_type: 'fill_in_blank'
  }
},

// Length
{
  content: 'How many centimeters are in 3.5 meters?',
  type: 'computation',
  difficulty: 2,
  metadata: {
    answer: '350',
    hint: 'Multiply meters by 100 to get centimeters',
    explanation: '3.5 meters = 3.5 × 100 cm = 350 cm',
    question_type: 'fill_in_blank'
  }
},
```

#### Data and Statistics (5 questions)

```javascript
// Analyzing Data
{
  content: 'The test scores of 5 students are: 85, 92, 78, 90, and 85. What is the mean (average) score?',
  type: 'computation',
  difficulty: 3,
  metadata: {
    answer: '86',
    hint: 'Add all scores and divide by the number of students',
    explanation: '(85 + 92 + 78 + 90 + 85) ÷ 5 = 430 ÷ 5 = 86',
    question_type: 'fill_in_blank'
  }
},
{
  content: 'The following data shows the number of books read by students: 3, 5, 2, 4, 3, 5, 4, 3. What is the mode?',
  type: 'multiple_choice',
  difficulty: 3,
  metadata: {
    answer: '3',
    choices: ['2', '3', '4', '5'],
    hint: 'The mode is the number that appears most frequently',
    explanation: 'The number 3 appears three times, more than any other number, so 3 is the mode',
    question_type: 'multiple_choice'
  }
},
```

#### Word Problems (5 questions)

```javascript
{
  content: 'Juana has 24 flowers. She wants to put an equal number in 4 vases. How many flowers will be in each vase?',
  type: 'word_problem',
  difficulty: 2,
  metadata: {
    answer: '6',
    hint: 'Divide the total number of flowers by the number of vases',
    explanation: '24 flowers ÷ 4 vases = 6 flowers per vase',
    question_type: 'fill_in_blank'
  }
},
{
  content: 'Carlos buys a notebook for 45 pesos and a pen for 12 pesos. If he pays with a 100-peso bill, how much change should he receive?',
  type: 'word_problem',
  difficulty: 3,
  metadata: {
    answer: '43',
    hint: 'Add the costs together, then subtract from 100',
    explanation: 'Cost: 45 + 12 = 57 pesos. Change: 100 - 57 = 43 pesos',
    question_type: 'fill_in_blank'
  }
},
```

### Question Distribution

Ensure the questions are well-distributed:

1. **By Difficulty**:
   - Easy (levels 1-2): ~30% of questions
   - Medium (level 3): ~40% of questions 
   - Challenging (levels 4-5): ~30% of questions

2. **By Type**:
   - Multiple choice: ~40% of questions
   - Fill-in-blank/computation: ~40% of questions
   - Word problems: ~20% of questions

3. **By Knowledge Component**:
   - Ensure each knowledge component has at least 3 additional questions
   - Focus more questions on core concepts (based on curriculum importance)

### Database Insertion

1. Assign starting ID values that won't conflict with existing records
2. Use the knowledgeComponents array to assign each question to a KC
3. Use bulkInsert for efficient insertion

### Rollback Strategy

In the down function, remove the added records by ID range:

```javascript
async down(queryInterface, Sequelize) {
  // Remove all content items with IDs starting from the defined range
  // The exact range will depend on the starting ID chosen in the up function
  await queryInterface.sequelize.query(
    `DELETE FROM content_items WHERE id >= [starting_id] AND id < [ending_id]`
  );
}
```

## Quality Considerations

1. **Ensure educational validity** - Questions should be grade-appropriate and align with curriculum standards
2. **Verify answer correctness** - Double-check all answers and explanations
3. **Include clear hints and explanations** - All questions should have helpful hints and thorough explanations
4. **Avoid duplicate questions** - Ensure questions are distinct from existing ones
5. **Use culturally relevant examples** - Include names and scenarios that reflect the target audience

## Implementation Notes

- When assigning questions to knowledge components, consider using a more sophisticated strategy than random assignment
- Consider adding difficulty tags to metadata to facilitate filtering
- Ensure all answers are properly formatted and consistent (e.g., numeric answers don't include units unless specified)