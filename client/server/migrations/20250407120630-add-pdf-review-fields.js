'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Define ENUM types (adjust type name if needed for your specific DB dialect, e.g., PostgreSQL)
    const reviewStatusType = Sequelize.ENUM('pending', 'in_progress', 'completed');
    const itemStatusType = Sequelize.ENUM('pending_review', 'approved', 'rejected');
    const suggestionSourceType = Sequelize.ENUM('automatic', 'manual');

    // Add columns to content_items table
    await queryInterface.addColumn('content_items', 'status', {
      type: itemStatusType,
      allowNull: false,
      defaultValue: 'pending_review'
    });
    await queryInterface.addColumn('content_items', 'pdf_upload_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null initially or for manually created items not linked to a specific upload
      references: {
        model: 'pdf_uploads', // name of the target table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Or 'CASCADE' if items should be deleted when PDF upload is deleted
    });
    await queryInterface.addColumn('content_items', 'suggestion_source', {
      type: suggestionSourceType,
      allowNull: false,
      defaultValue: 'automatic'
    });
    await queryInterface.addColumn('content_items', 'options', {
      type: Sequelize.JSONB, // Use JSONB for PostgreSQL, JSON for others
      allowNull: true,
    });
    await queryInterface.addColumn('content_items', 'correct_answer', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('content_items', 'explanation', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add columns to knowledge_components table
    await queryInterface.addColumn('knowledge_components', 'status', {
      type: itemStatusType,
      allowNull: false,
      defaultValue: 'pending_review'
    });
    await queryInterface.addColumn('knowledge_components', 'pdf_upload_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'pdf_uploads',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('knowledge_components', 'suggestion_source', {
      type: suggestionSourceType,
      allowNull: false,
      defaultValue: 'automatic'
    });
    await queryInterface.addColumn('knowledge_components', 'source_page', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Add column to pdf_uploads table
    await queryInterface.addColumn('pdf_uploads', 'review_status', {
      type: reviewStatusType,
      allowNull: false,
      defaultValue: 'pending'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove columns from content_items table
    await queryInterface.removeColumn('content_items', 'status');
    await queryInterface.removeColumn('content_items', 'pdf_upload_id');
    await queryInterface.removeColumn('content_items', 'suggestion_source');
    await queryInterface.removeColumn('content_items', 'options');
    await queryInterface.removeColumn('content_items', 'correct_answer');
    await queryInterface.removeColumn('content_items', 'explanation');

    // Remove columns from knowledge_components table
    await queryInterface.removeColumn('knowledge_components', 'status');
    await queryInterface.removeColumn('knowledge_components', 'pdf_upload_id');
    await queryInterface.removeColumn('knowledge_components', 'suggestion_source');
    await queryInterface.removeColumn('knowledge_components', 'source_page');

    // Remove column from pdf_uploads table
    await queryInterface.removeColumn('pdf_uploads', 'review_status');

    // If using PostgreSQL, you might need to explicitly drop the ENUM types
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_content_items_status";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_content_items_suggestion_source";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_knowledge_components_status";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_knowledge_components_suggestion_source";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pdf_uploads_review_status";');
  }
};
