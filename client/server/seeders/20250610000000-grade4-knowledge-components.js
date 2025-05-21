'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Create a comprehensive set of knowledge components for Grade 4
    const grade4Components = [
      // Number Sense (NS)
      { 
        name: 'Representing Numbers from 10,001 to 100,000', 
        curriculum_code: 'G4-NS-1', 
        description: 'Learning to represent numbers from 10,001 to 100,000 using various models', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }), 
        status: 'approved',
        suggestion_source: 'manual',
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Place Value and Digits in 5 to 6-digit Numbers', 
        curriculum_code: 'G4-NS-2', 
        description: 'Identifying place value and value of digits in 5 to 6-digit numbers', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Reading and Writing Numbers to 100,000', 
        curriculum_code: 'G4-NS-3', 
        description: 'Reading and writing numbers to 100,000 in symbols and words', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Comparing and Ordering 5 to 6-digit Numbers', 
        curriculum_code: 'G4-NS-4', 
        description: 'Comparing and ordering 5 to 6-digit numbers using symbols and on a number line', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Number Sense', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      
      // Fractions (FRAC)
      { 
        name: 'Proper and Improper Fractions', 
        curriculum_code: 'G4-FRAC-1', 
        description: 'Identifying and representing proper and improper fractions', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Fractions', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Mixed Numbers', 
        curriculum_code: 'G4-FRAC-2', 
        description: 'Converting between improper fractions and mixed numbers', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Fractions', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Equivalent Fractions', 
        curriculum_code: 'G4-FRAC-3', 
        description: 'Finding equivalent fractions using multiplication and division', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Fractions', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      
      // Operations (OPS)
      { 
        name: 'Addition of Numbers up to 100,000', 
        curriculum_code: 'G4-OPS-1', 
        description: 'Adding whole numbers with sums up to 100,000', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Operations', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Subtraction of Numbers up to 100,000', 
        curriculum_code: 'G4-OPS-2', 
        description: 'Subtracting whole numbers up to 100,000', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Operations', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Multiplication of 2-3 Digit Numbers', 
        curriculum_code: 'G4-OPS-3', 
        description: 'Multiplying 2-3 digit numbers by 1-2 digit numbers', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Operations', difficulty: 4 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Division with Remainders', 
        curriculum_code: 'G4-OPS-4', 
        description: 'Dividing 2-3 digit numbers by 1 digit with remainders', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Operations', difficulty: 4 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      
      // Geometry (GEO)
      { 
        name: 'Parallel and Perpendicular Lines', 
        curriculum_code: 'G4-GEO-1', 
        description: 'Identifying and constructing parallel and perpendicular lines', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Polygons Classification', 
        curriculum_code: 'G4-GEO-2', 
        description: 'Classifying polygons based on sides and angles', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Symmetry in 2D Shapes', 
        curriculum_code: 'G4-GEO-3', 
        description: 'Identifying lines of symmetry and creating symmetric designs', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      
      // Measurement (MEAS)
      { 
        name: 'Metric Units of Length', 
        curriculum_code: 'G4-MEAS-1', 
        description: 'Converting between metric units of length (mm, cm, m, km)', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Measurement', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Area of Rectangles and Squares', 
        curriculum_code: 'G4-MEAS-2', 
        description: 'Calculating area of rectangles and squares using formulas', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Measurement', difficulty: 3 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      },
      { 
        name: 'Volume of Rectangular Prisms', 
        curriculum_code: 'G4-MEAS-3', 
        description: 'Understanding and calculating volume of rectangular prisms', 
        grade_level: 4, 
        metadata: JSON.stringify({ category: 'Measurement', difficulty: 4 }),
        status: 'approved',
        suggestion_source: 'manual', 
        createdAt, 
        updatedAt 
      }
    ];
    
    // Insert knowledge components
    await queryInterface.bulkInsert('knowledge_components', grade4Components, {});
  },

  async down (queryInterface, Sequelize) {
    // Delete only the Grade 4 components we added
    await queryInterface.bulkDelete('knowledge_components', {
      grade_level: 4,
      curriculum_code: {
        [Sequelize.Op.in]: [
          'G4-NS-1', 'G4-NS-2', 'G4-NS-3', 'G4-NS-4',
          'G4-FRAC-1', 'G4-FRAC-2', 'G4-FRAC-3',
          'G4-OPS-1', 'G4-OPS-2', 'G4-OPS-3', 'G4-OPS-4',
          'G4-GEO-1', 'G4-GEO-2', 'G4-GEO-3',
          'G4-MEAS-1', 'G4-MEAS-2', 'G4-MEAS-3'
        ]
      }
    }, {});
  }
}; 