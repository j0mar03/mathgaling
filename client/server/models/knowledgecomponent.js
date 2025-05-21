'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class KnowledgeComponent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      KnowledgeComponent.hasMany(models.ContentItem, { foreignKey: 'knowledge_component_id' });
      KnowledgeComponent.hasMany(models.KnowledgeState, { foreignKey: 'knowledge_component_id' });
      
      // Self-reference for prerequisites
      KnowledgeComponent.belongsToMany(models.KnowledgeComponent, {
        through: 'kc_prerequisites',
        as: 'prerequisites',
        foreignKey: 'knowledge_component_id',
        otherKey: 'prerequisite_id'
      });
      
      KnowledgeComponent.belongsToMany(models.KnowledgeComponent, {
        through: 'kc_prerequisites',
        as: 'dependent_kcs',
        foreignKey: 'prerequisite_id',
        otherKey: 'knowledge_component_id'
      });
      
      // Add association with LearningPath
      KnowledgeComponent.belongsToMany(models.LearningPath, {
        through: 'LearningPathComponents',
        foreignKey: 'knowledge_component_id',
        otherKey: 'learning_path_id'
      });
      
      KnowledgeComponent.belongsTo(models.PdfUpload, { foreignKey: 'pdf_upload_id', as: 'sourcePdf' }); // Added association for review source
    }
  }
  
  KnowledgeComponent.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    curriculum_code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    grade_level: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
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
      },
      comment: 'Additional metadata including BKT parameters'
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
    source_page: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'KnowledgeComponent',
    tableName: 'knowledge_components',
    timestamps: true
    // Removed the 'basic' scope definition
  });
  
  return KnowledgeComponent;
};
