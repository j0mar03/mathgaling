'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ContentItem.belongsTo(models.KnowledgeComponent, { foreignKey: 'knowledge_component_id' });
      ContentItem.hasMany(models.Response, { foreignKey: 'content_item_id' });
      ContentItem.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'creator' }); // Added association to Teacher
      ContentItem.belongsTo(models.PdfUpload, { foreignKey: 'pdf_upload_id', as: 'sourcePdf' }); // Added association for review source
    }
  }
  ContentItem.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true // Or false if required
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true // Or false if required
    },
    metadata: {
      type: DataTypes.JSONB, // Use JSONB for PostgreSQL
      allowNull: true
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    knowledge_component_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Or false if required
      references: {
        model: 'knowledge_components', // Table name
        key: 'id'
      }
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'English',
      allowNull: false
    },
    teacher_id: { // Added teacher_id field
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for content potentially created by admins or system
      references: {
        model: 'teachers', // Table name
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // Or 'CASCADE' if CIs should be deleted when teacher is deleted
    },
    status: {
      type: DataTypes.ENUM('pending_review', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending_review'
    },
    pdf_upload_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pdf_uploads',
        key: 'id'
      }
      // Associations handle onUpdate/onDelete
    },
    suggestion_source: {
      type: DataTypes.ENUM('automatic', 'manual'),
      allowNull: false,
      defaultValue: 'automatic'
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    correct_answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
    // createdAt and updatedAt are handled by Sequelize automatically
  }, {
    sequelize,
    modelName: 'ContentItem',
    tableName: 'content_items', // Explicitly define table name
    timestamps: true // Enable automatic timestamps
  });
  return ContentItem;
};