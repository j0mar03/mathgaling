'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pdf_uploads', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Original filename of the uploaded PDF'
      },
      filepath: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Server path to the stored PDF file'
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teachers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      page_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of pages in the PDF'
      },
      status: {
        type: Sequelize.ENUM('uploaded', 'processing', 'processed', 'kcs_created', 'content_items_created', 'error'),
        defaultValue: 'uploaded',
        allowNull: false,
        comment: 'Current status of the PDF processing workflow'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata about the PDF and extraction results'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When PDF processing completed'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pdf_uploads');
  }
};
