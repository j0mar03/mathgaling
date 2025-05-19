'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all knowledge components to ensure content for each
    const knowledgeComponents = await queryInterface.sequelize.query(
      'SELECT id, name FROM knowledge_components;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (knowledgeComponents.length === 0) {
      console.log('No knowledge components found, skipping content item seed');
      return;
    }

    console.log(`Found ${knowledgeComponents.length} knowledge components to create content for`);

    // Create content items for each knowledge component
    const now = new Date();
    const contentItems = [];

    // Sample question templates
    const questionTemplates = [
      "What is {topic}?",
      "Solve the following problem about {topic}:",
      "Explain how {topic} works in your own words.",
      "Calculate the answer to this {topic} question:",
      "Choose the correct definition of {topic}:"
    ];

    // Sample multiple choice options
    const sampleChoices = [
      ["Option A is correct", "Option B", "Option C", "Option D"],
      ["The first choice", "The second choice (correct)", "The third choice", "The fourth choice"],
      ["This is wrong", "This is also wrong", "This is the right answer", "This is wrong too"],
      ["Incorrect option", "Another wrong option", "Yet another wrong choice", "The correct answer"]
    ];

    // Sample hints
    const hints = [
      "Think about what you learned in the previous lesson.",
      "Remember the formula we discussed.",
      "Look at the examples from class.",
      "Consider the key principles we covered."
    ];

    // Sample explanations
    const explanations = [
      "The correct answer demonstrates understanding of the core concept.",
      "This solution applies the formula correctly to get the right result.",
      "The answer follows from the principles we discussed in class.",
      "This is correct because it properly applies the steps we learned."
    ];

    // Create 5 content items for each knowledge component
    for (const kc of knowledgeComponents) {
      for (let i = 0; i < 5; i++) {
        // Randomly select question type: multiple_choice or question
        const type = Math.random() > 0.3 ? 'multiple_choice' : 'question';

        // Format question
        const questionTemplate = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
        const question = questionTemplate.replace('{topic}', kc.name);

        // Generate metadata based on type
        let metadata = {};

        if (type === 'multiple_choice') {
          const choices = sampleChoices[Math.floor(Math.random() * sampleChoices.length)];
          // Ensure answerIndex is valid before accessing choices
          let answerIndex = choices.findIndex(c => c.includes('correct'));
          if (answerIndex === -1) answerIndex = 0; // Default to first option if 'correct' isn't found
          const correctAnswer = choices[answerIndex];

          metadata = {
            choices: choices,
            answer: correctAnswer,
            hint: hints[Math.floor(Math.random() * hints.length)],
            explanation: explanations[Math.floor(Math.random() * explanations.length)],
            difficulty: Math.random() * 0.5 + 0.3 // Between 0.3 and 0.8
          };
        } else {
          // For open-ended questions
          metadata = {
            hint: hints[Math.floor(Math.random() * hints.length)],
            explanation: explanations[Math.floor(Math.random() * explanations.length)],
            difficulty: Math.random() * 0.5 + 0.3 // Between 0.3 and 0.8
          };
        }

        contentItems.push({
          knowledge_component_id: kc.id,
          type: type,
          content: question,
          language: 'English',
          metadata: JSON.stringify(metadata),
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // Condition changed to prevent execution due to conflicts with replace-kcs-and-cis seeder
    if (false) {
      console.log(`Skipping dynamic Content Item insertion in 20250407190000-add-more-content-items.js.`);
      // --- Original Code Block (Now Skipped) ---
      // console.log(`Creating ${contentItems.length} content items`);
      // try {
      //   await queryInterface.bulkInsert('content_items', contentItems);
      //   console.log('Content items created successfully');
      // } catch (error) {
      //   console.error('Error creating content items:', error);
      // }
      // --- End Original Code Block ---
    } else {
       console.log('Skipping dynamic Content Item insertion in 20250407190000-add-more-content-items.js due to modified condition.');
    }
  }, // End of up function

  async down(queryInterface, Sequelize) {
    // This would delete ALL content items, which might not be desirable
    // Instead, we might want to delete only the ones created by this seeder
    // For simplicity, we're not implementing a down migration
    console.log('Down migration not implemented for content items seeder');
  }
};
