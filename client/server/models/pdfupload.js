'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PdfUpload extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PdfUpload.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'uploader' });
      // Associations to track suggested items for review
      PdfUpload.hasMany(models.ContentItem, { foreignKey: 'pdf_upload_id', as: 'suggestedContentItems' });
      PdfUpload.hasMany(models.KnowledgeComponent, { foreignKey: 'pdf_upload_id', as: 'suggestedKnowledgeComponents' });
    }
  }
  
  PdfUpload.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Original filename of the uploaded PDF'
    },
    filepath: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Server path to the stored PDF file'
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    page_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of pages in the PDF'
    },
    status: {
      type: DataTypes.ENUM('uploaded', 'processing', 'processed', 'kcs_created', 'content_items_created', 'error'),
      defaultValue: 'uploaded',
      allowNull: false,
      comment: 'Current status of the PDF processing workflow'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata about the PDF and extraction results'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When PDF processing completed'
    },
    review_status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status of the manual review process for extracted content'
    }
  }, {
    sequelize,
    modelName: 'PdfUpload',
    tableName: 'pdf_uploads',
    timestamps: true
  });
  
  return PdfUpload;
};
