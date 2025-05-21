'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class KnowledgeState extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      KnowledgeState.belongsTo(models.Student, { foreignKey: 'student_id' });
      KnowledgeState.belongsTo(models.KnowledgeComponent, { foreignKey: 'knowledge_component_id' });
    }
  }
  KnowledgeState.init({
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
    knowledge_component_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'knowledge_components', // Table name
        key: 'id'
      }
    },
    p_mastery: {
      type: DataTypes.FLOAT, // Use FLOAT for REAL
      defaultValue: 0.3,
      allowNull: false
    },
    p_transit: {
      type: DataTypes.FLOAT,
      defaultValue: 0.1,
      allowNull: false
    },
    p_guess: {
      type: DataTypes.FLOAT,
      defaultValue: 0.2,
      allowNull: false
    },
    p_slip: {
      type: DataTypes.FLOAT,
      defaultValue: 0.1,
      allowNull: false
    }
    // updated_at is handled by Sequelize automatically (timestamps: true)
    // created_at is also handled automatically
  }, {
    sequelize,
    modelName: 'KnowledgeState',
    tableName: 'knowledge_states', // Explicitly define table name
    timestamps: true // Enable automatic timestamps (createdAt and updatedAt)
  });
  return KnowledgeState;
};