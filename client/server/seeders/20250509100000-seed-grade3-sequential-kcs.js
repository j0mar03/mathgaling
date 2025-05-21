'use strict';
const db = require('../models'); // Import the db object

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const gradeLevel = 3;

    const kcsData = [
      // Quarter 1, Module 1
      { name: 'KC1: Representing Numbers from 1001 to 10,000', description: 'Visualizing and representing numbers in the range 1001 to 10,000 using various methods.', curriculum_code_suffix: 'Q1M1-KC01' },
      { name: 'KC2: Identifying Place Value and Value of Digits in 4- to 5-Digit Numbers', description: 'Understanding and identifying the place value and the value of each digit in 4- to 5-digit numbers.', curriculum_code_suffix: 'Q1M1-KC02' },
      { name: 'KC3: Reading and Writing Numbers from 1001 to 10,000 in symbols and words', description: 'Reading and writing numbers from 1001 to 10,000 accurately in both symbols (digits) and words.', curriculum_code_suffix: 'Q1M1-KC03' },
      // Quarter 1, Module 2
      { name: 'KC4: Comparing Numbers up to 10,000 using symbols (>, <, =)', description: 'Comparing numbers up to 10,000 using relation symbols: greater than (>), less than (<), and equal to (=).', curriculum_code_suffix: 'Q1M2-KC04' },
      { name: 'KC5: Ordering Numbers with 4 to 5 Digits in ascending or descending order', description: 'Arranging 4- to 5-digit numbers in increasing (ascending) or decreasing (descending) order.', curriculum_code_suffix: 'Q1M2-KC05' },
      { name: 'KC6: Rounding Numbers to the Nearest Tens, Hundreds, and Thousands', description: 'Applying rules to round numbers to the nearest specified place value (tens, hundreds, thousands).', curriculum_code_suffix: 'Q1M2-KC06' },
      // Quarter 1, Module 3
      { name: 'KC7: Understanding Ordinal Numbers from 1st to 100th, with emphasis on positions from 21st to 100th using a point of reference', description: 'Identifying and using ordinal numbers from 1st to 100th to specify position.', curriculum_code_suffix: 'Q1M3-KC07' },
      { name: 'KC8: Identifying, Reading, and Writing Money in symbols and words', description: 'Recognizing Philippine currency and reading/writing monetary amounts in symbols (e.g., PhP 36.75) and words.', curriculum_code_suffix: 'Q1M3-KC08' },
      // Quarter 1, Module 4
      { name: 'KC9: Comparing the value of different denominations of coins and paper money up to P1,000 using relation symbols (> , < , =)', description: 'Comparing monetary values using appropriate relation symbols.', curriculum_code_suffix: 'Q1M4-KC09' },
      { name: 'KC10: Adding numbers with three addends, with and without regrouping', description: 'Performing addition operations with three numbers, handling regrouping.', curriculum_code_suffix: 'Q1M4-KC10' },
      // Quarter 1, Module 5
      { name: 'KC11: Estimating the sum of 3- to 4-digit addends with appropriate results', description: 'Using estimation strategies to approximate the sum of large numbers.', curriculum_code_suffix: 'Q1M5-KC11' },
      { name: 'KC12: Mentally adding 2-digit and 1-digit numbers with and without regrouping', description: 'Performing mental addition of 2-digit and 1-digit numbers.', curriculum_code_suffix: 'Q1M5-KC12' },
      { name: 'KC13: Mentally adding 2-digit to 3-digit numbers that are multiples of 100', description: 'Adding 2-digit numbers to 3-digit multiples of 100 using mental math.', curriculum_code_suffix: 'Q1M5-KC13' },
      // Quarter 1, Module 6
      { name: 'KC14: Solving routine word problems involving addition (and sometimes subtraction) with money', description: 'Applying addition/subtraction skills to solve standard word problems involving money.', curriculum_code_suffix: 'Q1M6-KC14' },
      { name: 'KC15: Solving non-routine word problems involving addition (and sometimes subtraction) with money', description: 'Solving complex, non-standard word problems involving addition/subtraction with money.', curriculum_code_suffix: 'Q1M6-KC15' },
      // Quarter 1, Module 7
      { name: 'KC16: Subtracting 3- to 4-digit numbers without regrouping', description: 'Performing subtraction of 3- to 4-digit numbers without regrouping.', curriculum_code_suffix: 'Q1M7-KC16' },
      // Quarter 1, Module 8
      { name: 'KC17: Subtracting 3- to 4-digit numbers with regrouping', description: 'Performing subtraction of 3- to 4-digit numbers with regrouping.', curriculum_code_suffix: 'Q1M8-KC17' },
      // Quarter 1, Module 9
      { name: 'KC18: Estimating the difference of two 3- to 4-digit numbers', description: 'Using estimation strategies to approximate the difference of large numbers.', curriculum_code_suffix: 'Q1M9-KC18' },
      // Quarter 2, Module 1
      { name: 'KC19: Visualizing and representing multiplication of numbers from 1 to 10 by 6, 7, 8, and 9 using sets, number lines, or arrays', description: 'Understanding multiplication concepts for numbers 1-10 by 6-9.', curriculum_code_suffix: 'Q2M1-KC19' },
      { name: 'KC20: Stating multiplication facts for numbers 1 to 10, including skip counting and completing multiplication tables', description: 'Recalling multiplication facts and understanding skip counting.', curriculum_code_suffix: 'Q2M1-KC20' },
      // Quarter 2, Module 2
      { name: 'KC21: Applying properties of multiplication (commutative, distributive, associative) to solve number sentences and verify equivalence', description: 'Using multiplication properties to solve problems.', curriculum_code_suffix: 'Q2M2-KC21' },
      { name: 'KC22: Multiplying 2-3 digit numbers by 1-digit numbers, with and without regrouping, using place value and standard algorithms', description: 'Multiplying multi-digit numbers by single-digit numbers.', curriculum_code_suffix: 'Q2M2-KC22' },
      { name: 'KC23: Solving routine word problems involving multiplication of 2-3 digit numbers by 1-digit numbers, including money calculations', description: 'Solving word problems involving multiplication and money.', curriculum_code_suffix: 'Q2M2-KC23' },
      // Quarter 2, Module 3
      { name: 'KC24: Multiplying 2-digit numbers by 2-digit numbers or 2-3 digit numbers by multiples of 10, 100, or 1000, with and without regrouping, using distributive property or standard algorithms', description: 'Multiplying multi-digit numbers by multi-digit numbers or multiples of 10/100/1000.', curriculum_code_suffix: 'Q2M3-KC24' },
      { name: 'KC25: Solving routine word problems involving multiplication of 2-3 digit numbers by 2-digit numbers', description: 'Solving word problems involving multiplication of two multi-digit numbers.', curriculum_code_suffix: 'Q2M3-KC25' },
      // Quarter 2, Module 4
      { name: 'KC26: Estimating products of 2-3 digit numbers by 1-2 digit numbers by rounding to the nearest tens or hundreds and multiplying the rounded numbers', description: 'Estimating products of multi-digit numbers.', curriculum_code_suffix: 'Q2M4-KC26' },
      { name: 'KC27: Solving routine word problems involving estimated products of 2-3 digit numbers by 1-2 digit numbers', description: 'Solving word problems involving estimated products.', curriculum_code_suffix: 'Q2M4-KC27' },
      // Quarter 2, Module 5
      { name: 'KC28: Solving routine word problems involving multiplication of 2-3 digit numbers by 1-2 digit numbers, followed by addition of the products to find a total quantity, without regrouping in the addition step', description: 'Solving multi-step word problems involving multiplication and addition.', curriculum_code_suffix: 'Q2M5-KC28' },
      { name: 'KC29: Identifying the components of a routine word problem to solve multiplication-based problems', description: 'Analyzing word problems to identify components for solving multiplication problems.', curriculum_code_suffix: 'Q2M5-KC29' },
      // Quarter 2, Module 6
      { name: 'KC30: Stating and identifying multiples of 1- to 2-digit numbers, including skip counting and completing sequences of multiples', description: 'Understanding and identifying multiples of numbers.', curriculum_code_suffix: 'Q2M6-KC30' },
      { name: 'KC31: Dividing numbers up to 100 by 6, 7, 8, or 9 without remainders, including solving routine word problems involving such divisions', description: 'Performing division for numbers up to 100 by 6-9 without remainders.', curriculum_code_suffix: 'Q2M6-KC31' },
    ];

    for (const kc of kcsData) {
      const curriculum_code = `G${gradeLevel}-${kc.curriculum_code_suffix}`;
      const [knowledgeComponent, created] = await db.KnowledgeComponent.findOrCreate({
        where: { curriculum_code: curriculum_code },
        defaults: {
          name: kc.name,
          description: kc.description,
          curriculum_code: curriculum_code,
          grade_level: gradeLevel,
          metadata: JSON.stringify({ bktParams: { pL0: 0.3, pT: 0.09, pS: 0.1, pG: 0.2 } }), // Default BKT params
          status: 'approved',
          suggestion_source: 'manual',
          createdAt: now,
          updatedAt: now
        }
      });

      if (!created) {
        // If it already existed, update its name and description if they are different
        if (knowledgeComponent.name !== kc.name || knowledgeComponent.description !== kc.description) {
          await knowledgeComponent.update({
            name: kc.name,
            description: kc.description,
            updatedAt: now
          });
          console.log(`Updated KC: ${curriculum_code} - ${kc.name}`);
        }
      } else {
        console.log(`Created KC: ${curriculum_code} - ${kc.name}`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // This down migration is simplified; it won't remove KCs if they were updated.
    // For a full revert, you might need to store IDs or be more specific.
    const gradeLevel = 3;
    const curriculumCodePrefix = `G${gradeLevel}-`;
    await queryInterface.bulkDelete('knowledge_components', {
      curriculum_code: {
        [Sequelize.Op.startsWith]: curriculumCodePrefix
      },
      grade_level: gradeLevel
    }, {});
    console.log(`Attempted to delete Grade ${gradeLevel} KCs with prefix ${curriculumCodePrefix}.`);
  }
};
