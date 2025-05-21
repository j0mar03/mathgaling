'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class EngagementMetric extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      EngagementMetric.belongsTo(models.Student, { foreignKey: 'student_id' });
    }
  }
  EngagementMetric.init({
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
    session_id: {
      type: DataTypes.STRING,
      allowNull: true // Or false if required
    },
    time_on_task: {
      type: DataTypes.INTEGER, // Assuming time in ms or seconds
      allowNull: true
    },
    help_requests: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    disengagement_indicators: {
      type: DataTypes.JSONB, // Use JSONB for storing indicators
      allowNull: true
    }
    // timestamp (createdAt) is handled by Sequelize automatically
    // updatedAt is also handled automatically
  }, {
    sequelize,
    modelName: 'EngagementMetric',
    tableName: 'engagement_metrics', // Explicitly define table name
    timestamps: true // Enable automatic timestamps (createdAt and updatedAt)
  });
  return EngagementMetric;
};