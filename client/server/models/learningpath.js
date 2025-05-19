'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LearningPath extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      LearningPath.belongsTo(models.Student, { foreignKey: 'student_id' });
      // Add the missing association with KnowledgeComponent
      // This should be a many-to-many relationship
      LearningPath.belongsToMany(models.KnowledgeComponent, { 
        through: 'LearningPathComponents',
        foreignKey: 'learning_path_id',
        otherKey: 'knowledge_component_id'
      });
    }
  }
  LearningPath.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students', // Table name
        key: 'id'
      }
    },
    sequence: {
      type: DataTypes.JSONB, // Assuming sequence is stored as JSON (e.g., array of IDs)
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true // e.g., 'active', 'completed', 'pending'
    }
    // created_at and updated_at are handled by Sequelize automatically
  }, {
    sequelize,
    modelName: 'LearningPath',
    tableName: 'learning_paths', // Explicitly define table name
    timestamps: true // Enable automatic timestamps
  });
  return LearningPath;
};
