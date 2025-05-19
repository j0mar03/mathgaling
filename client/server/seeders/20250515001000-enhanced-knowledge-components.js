'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Create a comprehensive set of knowledge components (KC1-KC49)
    const knowledgeComponents = [
      // Quarter 1 - Number Sense (NS)
      { id: 1, name: 'Representing Numbers from 1001 to 10,000', curriculum_code: 'G3-NS-1', description: 'Learning to represent numbers from 1001 to 10,000 using various models', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }), createdAt, updatedAt },
      { id: 2, name: 'Identifying Place Value and Digits', curriculum_code: 'G3-NS-2', description: 'Identifying place value and value of digits in 4- to 5-digit numbers', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }), createdAt, updatedAt },
      { id: 3, name: 'Reading and Writing Numbers in Symbols and Words', curriculum_code: 'G3-NS-3', description: 'Reading and writing numbers from 1001 to 10,000 in symbols and words', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }), createdAt, updatedAt },
      { id: 4, name: 'Comparing Numbers up to 10,000', curriculum_code: 'G3-NS-4', description: 'Comparing numbers up to 10,000 using symbols (>, <, =)', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }), createdAt, updatedAt },
      { id: 5, name: 'Ordering Numbers with 4 to 5 Digits', curriculum_code: 'G3-NS-5', description: 'Ordering numbers with 4 to 5 digits in ascending or descending order', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }), createdAt, updatedAt },
      { id: 6, name: 'Rounding Numbers', curriculum_code: 'G3-NS-6', description: 'Rounding numbers to the nearest tens, hundreds, and thousands', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 3 }), createdAt, updatedAt },
      { id: 7, name: 'Understanding Ordinal Numbers', curriculum_code: 'G3-NS-7', description: 'Understanding ordinal numbers from 1st to 100th', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 2 }), createdAt, updatedAt },
      { id: 8, name: 'Identifying Money in Symbols and Words', curriculum_code: 'G3-NS-8', description: 'Identifying, reading, and writing money in symbols and words', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 3 }), createdAt, updatedAt },
      { id: 9, name: 'Comparing Values of Money', curriculum_code: 'G3-NS-9', description: 'Comparing values of different denominations of coins and paper money', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 3 }), createdAt, updatedAt },
      { id: 10, name: 'Addition with Three Addends', curriculum_code: 'G3-NS-10', description: 'Adding numbers with three addends, with and without regrouping', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 3 }), createdAt, updatedAt },
      { id: 11, name: 'Estimating Sums', curriculum_code: 'G3-NS-11', description: 'Estimating the sum of 3- to 4-digit addends', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 3 }), createdAt, updatedAt },
      { id: 12, name: 'Mental Addition Skills', curriculum_code: 'G3-NS-12', description: 'Mentally adding 2-digit and 1-digit numbers with and without regrouping', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense', difficulty: 3 }), createdAt, updatedAt },
      
      // Quarter 2 - Number Sense and Operations (NSO)
      { id: 13, name: 'Word Problems Involving Addition', curriculum_code: 'G3-NSO-1', description: 'Solving routine word problems involving addition with money', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 14, name: 'Subtracting Without Regrouping', curriculum_code: 'G3-NSO-2', description: 'Subtracting 3- to 4-digit numbers without regrouping', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 2 }), createdAt, updatedAt },
      { id: 15, name: 'Subtracting With Regrouping', curriculum_code: 'G3-NSO-3', description: 'Subtracting 3- to 4-digit numbers with regrouping', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 16, name: 'Estimating Differences', curriculum_code: 'G3-NSO-4', description: 'Estimating the difference of two 3- to 4-digit numbers', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 17, name: 'Mental Subtraction Skills', curriculum_code: 'G3-NSO-5', description: 'Mentally subtracting from 3-digit numbers', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 18, name: 'Word Problems with Subtraction', curriculum_code: 'G3-NSO-6', description: 'Solving word problems involving subtraction with money', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 19, name: 'Multiplication Visualization', curriculum_code: 'G3-NSO-7', description: 'Visualizing multiplication using sets, number lines, or arrays', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 20, name: 'Multiplication Facts', curriculum_code: 'G3-NSO-8', description: 'Learning multiplication facts for numbers 1 to 10', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 21, name: 'Multiplication Properties', curriculum_code: 'G3-NSO-9', description: 'Understanding properties of multiplication (commutative, distributive, associative)', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 4 }), createdAt, updatedAt },
      { id: 22, name: 'Multiplying 2-3 Digits by 1 Digit', curriculum_code: 'G3-NSO-10', description: 'Multiplying 2-3 digit numbers by 1-digit numbers', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 3 }), createdAt, updatedAt },
      { id: 23, name: 'Multiplying 2-Digit Numbers', curriculum_code: 'G3-NSO-11', description: 'Multiplying 2-digit numbers by 2-digit numbers', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 4 }), createdAt, updatedAt },
      { id: 24, name: 'Estimation in Multiplication', curriculum_code: 'G3-NSO-12', description: 'Estimating products by rounding to nearest tens or hundreds', grade_level: 3, metadata: JSON.stringify({ category: 'Number Sense & Operations', difficulty: 4 }), createdAt, updatedAt },
      
      // Quarter 3 - Geometry (GEO)
      { id: 25, name: 'Identifying and Describing Polygons', curriculum_code: 'G3-GEO-1', description: 'Identifying and describing polygons: triangle, square, rectangle, rhombus, trapezoid', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 2 }), createdAt, updatedAt },
      { id: 26, name: 'Identifying Solid Figures', curriculum_code: 'G3-GEO-2', description: 'Identifying solid figures: cube, prism, pyramid, sphere, cylinder, and cone', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 2 }), createdAt, updatedAt },
      { id: 27, name: 'Finding Area Using Square Units', curriculum_code: 'G3-GEO-3', description: 'Determining area using square units', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 28, name: 'Finding Perimeters of Polygons', curriculum_code: 'G3-GEO-4', description: 'Finding perimeters of polygons', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 29, name: 'Relating Fractions to Area', curriculum_code: 'G3-GEO-5', description: 'Understanding how fractions relate to dividing regions into equal parts', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 30, name: 'Symmetry in Shapes', curriculum_code: 'G3-GEO-6', description: 'Identifying symmetry in familiar shapes and objects', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 2 }), createdAt, updatedAt },
      { id: 31, name: 'Lines and Angles', curriculum_code: 'G3-GEO-7', description: 'Recognizing and classifying lines and angles in geometric figures', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 32, name: 'Spatial Visualization', curriculum_code: 'G3-GEO-8', description: 'Developing spatial visualization skills using 2D and 3D shapes', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 33, name: 'Drawing Geometric Shapes', curriculum_code: 'G3-GEO-9', description: 'Drawing geometric shapes using appropriate tools', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 34, name: 'Geometric Patterns', curriculum_code: 'G3-GEO-10', description: 'Identifying and extending geometric patterns', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 35, name: 'Transformations', curriculum_code: 'G3-GEO-11', description: 'Understanding basic transformations: slides, flips, and turns', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 3 }), createdAt, updatedAt },
      { id: 36, name: 'Coordinate Geometry', curriculum_code: 'G3-GEO-12', description: 'Introduction to coordinate geometry on a grid', grade_level: 3, metadata: JSON.stringify({ category: 'Geometry', difficulty: 4 }), createdAt, updatedAt },
      
      // Quarter 4 - Measurement and Statistics (MEAS)
      { id: 37, name: 'Time Concepts', curriculum_code: 'G3-MEAS-1', description: 'Understanding units of time: seconds, minutes, hours, days, weeks, months, years', grade_level: 3, metadata: JSON.stringify({ category: 'Measurement', difficulty: 2 }), createdAt, updatedAt },
      { id: 38, name: 'Reading Analog and Digital Clocks', curriculum_code: 'G3-MEAS-2', description: 'Reading and interpreting time from analog and digital clocks', grade_level: 3, metadata: JSON.stringify({ category: 'Measurement', difficulty: 2 }), createdAt, updatedAt },
      { id: 39, name: 'Time Problems', curriculum_code: 'G3-MEAS-3', description: 'Solving problems involving elapsed time', grade_level: 3, metadata: JSON.stringify({ category: 'Measurement', difficulty: 3 }), createdAt, updatedAt },
      { id: 40, name: 'Length Measurement', curriculum_code: 'G3-MEAS-4', description: 'Measuring length using appropriate tools and units', grade_level: 3, metadata: JSON.stringify({ category: 'Measurement', difficulty: 2 }), createdAt, updatedAt },
      { id: 41, name: 'Mass and Weight', curriculum_code: 'G3-MEAS-5', description: 'Measuring mass/weight using appropriate tools and units', grade_level: 3, metadata: JSON.stringify({ category: 'Measurement', difficulty: 2 }), createdAt, updatedAt },
      { id: 42, name: 'Capacity Measurement', curriculum_code: 'G3-MEAS-6', description: 'Measuring capacity using appropriate tools and units', grade_level: 3, metadata: JSON.stringify({ category: 'Measurement', difficulty: 2 }), createdAt, updatedAt },
      { id: 43, name: 'Temperature', curriculum_code: 'G3-MEAS-7', description: 'Reading and interpreting temperature from a thermometer', grade_level: 3, metadata: JSON.stringify({ category: 'Measurement', difficulty: 2 }), createdAt, updatedAt },
      { id: 44, name: 'Data Collection', curriculum_code: 'G3-STAT-1', description: 'Collecting data through observations, surveys, and experiments', grade_level: 3, metadata: JSON.stringify({ category: 'Statistics', difficulty: 2 }), createdAt, updatedAt },
      { id: 45, name: 'Organizing Data', curriculum_code: 'G3-STAT-2', description: 'Organizing data using tally marks, tables, and charts', grade_level: 3, metadata: JSON.stringify({ category: 'Statistics', difficulty: 3 }), createdAt, updatedAt },
      { id: 46, name: 'Bar Graphs', curriculum_code: 'G3-STAT-3', description: 'Representing data using bar graphs', grade_level: 3, metadata: JSON.stringify({ category: 'Statistics', difficulty: 3 }), createdAt, updatedAt },
      { id: 47, name: 'Pictographs', curriculum_code: 'G3-STAT-4', description: 'Representing data using pictographs', grade_level: 3, metadata: JSON.stringify({ category: 'Statistics', difficulty: 3 }), createdAt, updatedAt },
      { id: 48, name: 'Interpreting Graphs', curriculum_code: 'G3-STAT-5', description: 'Interpreting data from tables, charts, and graphs', grade_level: 3, metadata: JSON.stringify({ category: 'Statistics', difficulty: 3 }), createdAt, updatedAt },
      { id: 49, name: 'Probability Concepts', curriculum_code: 'G3-STAT-6', description: 'Introduction to basic probability concepts', grade_level: 3, metadata: JSON.stringify({ category: 'Statistics', difficulty: 4 }), createdAt, updatedAt }
    ];
    
    // Insert knowledge components
    await queryInterface.bulkInsert('knowledge_components', knowledgeComponents, {});
    
    // For some sample knowledge states to show mastery data
    const studentIds = [1, 2, 3]; // Assuming these students exist
    const knowledgeStates = [];
    
    // Create knowledge states for each student, for each KC
    for (const studentId of studentIds) {
      for (let kcId = 1; kcId <= 49; kcId++) {
        // Generate a random mastery level between 0.1 and 0.9
        const mastery = Math.round((0.1 + Math.random() * 0.8) * 100) / 100;
        
        knowledgeStates.push({
          student_id: studentId,
          knowledge_component_id: kcId,
          p_mastery: mastery,
          p_transit: 0.1,
          p_guess: 0.2,
          p_slip: 0.1,
          createdAt,
          updatedAt
        });
      }
    }
    
    // Insert knowledge states
    await queryInterface.bulkInsert('knowledge_states', knowledgeStates, {});
  },

  async down (queryInterface, Sequelize) {
    // First remove the knowledge states
    await queryInterface.bulkDelete('knowledge_states', {
      knowledge_component_id: { [Sequelize.Op.between]: [1, 49] }
    }, {});
    
    // Then remove the knowledge components
    await queryInterface.bulkDelete('knowledge_components', {
      id: { [Sequelize.Op.between]: [1, 49] }
    }, {});
  }
}; 