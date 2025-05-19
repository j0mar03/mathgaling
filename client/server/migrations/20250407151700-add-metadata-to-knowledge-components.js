'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('knowledge_components', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        bktParams: {
          pL0: 0.3,  // Initial probability of knowing the skill
          pT: 0.09,  // Probability of learning from not knowing
          pS: 0.1,   // Probability of slipping (incorrect when knowing)
          pG: 0.2    // Probability of guessing (correct when not knowing)
        },
        source: null,
        pdf_id: null,
        pdf_page: null,
        extraction_confidence: null
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('knowledge_components', 'metadata');
  }
};
