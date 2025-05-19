'use strict';

/** @type {import('sequelize-cli').Migration} */ // Note: This type hint is standard but technically incorrect for seeders
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('knowledge_components', [
      // --- Grade 3 ---
      { name: 'Addition within 1000', description: 'Adding two or three whole numbers with sums up to 1000.', grade_level: 3, curriculum_code: 'G3.NBT.A.2', createdAt: now, updatedAt: now },
      { name: 'Subtraction within 1000', description: 'Subtracting whole numbers within 1000.', grade_level: 3, curriculum_code: 'G3.NBT.A.2', createdAt: now, updatedAt: now },
      { name: 'Introduction to Multiplication', description: 'Understanding multiplication as equal groups.', grade_level: 3, curriculum_code: 'G3.OA.A.1', createdAt: now, updatedAt: now },
      { name: 'Introduction to Division', description: 'Understanding division as equal sharing.', grade_level: 3, curriculum_code: 'G3.OA.A.2', createdAt: now, updatedAt: now },
      { name: 'Multiplication/Division Relationship', description: 'Understanding division as an unknown-factor problem.', grade_level: 3, curriculum_code: 'G3.OA.B.6', createdAt: now, updatedAt: now },
      { name: 'Basic Multiplication Facts (0-10)', description: 'Fluently multiply within 100.', grade_level: 3, curriculum_code: 'G3.OA.C.7', createdAt: now, updatedAt: now },
      { name: 'Basic Division Facts (0-10)', description: 'Fluently divide within 100.', grade_level: 3, curriculum_code: 'G3.OA.C.7', createdAt: now, updatedAt: now },
      { name: 'Understanding Fractions (Unit Fractions)', description: 'Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts.', grade_level: 3, curriculum_code: 'G3.NF.A.1', createdAt: now, updatedAt: now },
      { name: 'Fractions on a Number Line', description: 'Represent fractions on a number line diagram.', grade_level: 3, curriculum_code: 'G3.NF.A.2', createdAt: now, updatedAt: now },
      { name: 'Telling Time (Nearest Minute)', description: 'Tell and write time to the nearest minute and measure time intervals.', grade_level: 3, curriculum_code: 'G3.MD.A.1', createdAt: now, updatedAt: now },
      { name: 'Area (Counting Unit Squares)', description: 'Measure areas by counting unit squares.', grade_level: 3, curriculum_code: 'G3.MD.C.6', createdAt: now, updatedAt: now },
      { name: 'Perimeter of Polygons', description: 'Find the perimeter given the side lengths.', grade_level: 3, curriculum_code: 'G3.MD.D.8', createdAt: now, updatedAt: now },

      // --- Grade 4 ---
      { name: 'Multiplicative Comparisons', description: 'Interpret a multiplication equation as a comparison.', grade_level: 4, curriculum_code: 'G4.OA.A.1', createdAt: now, updatedAt: now },
      { name: 'Multiplication/Division Word Problems', description: 'Solve word problems involving multiplicative comparison.', grade_level: 4, curriculum_code: 'G4.OA.A.2', createdAt: now, updatedAt: now },
      { name: 'Place Value Understanding', description: 'Recognize that in a multi-digit whole number, a digit in one place represents ten times what it represents in the place to its right.', grade_level: 4, curriculum_code: 'G4.NBT.A.1', createdAt: now, updatedAt: now },
      { name: 'Multi-Digit Multiplication', description: 'Multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers.', grade_level: 4, curriculum_code: 'G4.NBT.B.5', createdAt: now, updatedAt: now },
      { name: 'Multi-Digit Division', description: 'Find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors.', grade_level: 4, curriculum_code: 'G4.NBT.B.6', createdAt: now, updatedAt: now },
      { name: 'Equivalent Fractions', description: 'Explain why a fraction a/b is equivalent to a fraction (n×a)/(n×b) by using visual fraction models.', grade_level: 4, curriculum_code: 'G4.NF.A.1', createdAt: now, updatedAt: now },
      { name: 'Comparing Fractions', description: 'Compare two fractions with different numerators and different denominators.', grade_level: 4, curriculum_code: 'G4.NF.A.2', createdAt: now, updatedAt: now },
      { name: 'Adding/Subtracting Fractions (Same Denominator)', description: 'Add and subtract fractions with like denominators.', grade_level: 4, curriculum_code: 'G4.NF.B.3', createdAt: now, updatedAt: now },
      { name: 'Multiplying Fractions by Whole Numbers', description: 'Multiply a fraction by a whole number.', grade_level: 4, curriculum_code: 'G4.NF.B.4', createdAt: now, updatedAt: now },
      { name: 'Decimal Notation for Fractions', description: 'Use decimal notation for fractions with denominators 10 or 100.', grade_level: 4, curriculum_code: 'G4.NF.C.6', createdAt: now, updatedAt: now },
      { name: 'Comparing Decimals', description: 'Compare two decimals to hundredths.', grade_level: 4, curriculum_code: 'G4.NF.C.7', createdAt: now, updatedAt: now },
      { name: 'Area and Perimeter Formulas', description: 'Apply the area and perimeter formulas for rectangles in real world problems.', grade_level: 4, curriculum_code: 'G4.MD.A.3', createdAt: now, updatedAt: now },
      { name: 'Angle Measurement', description: 'Recognize angles as geometric shapes and understand concepts of angle measurement.', grade_level: 4, curriculum_code: 'G4.MD.C.5', createdAt: now, updatedAt: now },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Define specific names or criteria to delete only these seeded KCs
    const kcNamesToDelete = [
      'Addition within 1000', 'Subtraction within 1000', 'Introduction to Multiplication',
      'Introduction to Division', 'Multiplication/Division Relationship', 'Basic Multiplication Facts (0-10)',
      'Basic Division Facts (0-10)', 'Understanding Fractions (Unit Fractions)', 'Fractions on a Number Line',
      'Telling Time (Nearest Minute)', 'Area (Counting Unit Squares)', 'Perimeter of Polygons',
      'Multiplicative Comparisons', 'Multiplication/Division Word Problems', 'Place Value Understanding',
      'Multi-Digit Multiplication', 'Multi-Digit Division', 'Equivalent Fractions', 'Comparing Fractions',
      'Adding/Subtracting Fractions (Same Denominator)', 'Multiplying Fractions by Whole Numbers',
      'Decimal Notation for Fractions', 'Comparing Decimals', 'Area and Perimeter Formulas', 'Angle Measurement'
    ];
    await queryInterface.bulkDelete('knowledge_components', {
      name: {
        [Sequelize.Op.in]: kcNamesToDelete
      }
    }, {});
  }
};
