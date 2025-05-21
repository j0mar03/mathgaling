'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Response extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Response.belongsTo(models.Student, { foreignKey: 'student_id' });
      Response.belongsTo(models.ContentItem, { foreignKey: 'content_item_id' });
    }
  }
  Response.init({
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
    content_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'content_items', // Table name
        key: 'id'
      }
    },
    answer: {
      type: DataTypes.TEXT, // Or STRING if answers are short
      allowNull: true
    },
    correct: {
      type: DataTypes.BOOLEAN, // Use BOOLEAN for integer 0/1
      allowNull: true // Or false if always required
    },
    time_spent: {
      type: DataTypes.INTEGER, // Assuming time in ms or seconds
      allowNull: true
    },
    interaction_data: {
      type: DataTypes.JSONB, // Use JSONB for interaction details
      allowNull: true
    }
    // created_at is handled by Sequelize automatically
    // updated_at is also handled automatically
  }, {
    sequelize,
    modelName: 'Response',
    tableName: 'responses', // Explicitly define table name
    timestamps: true // Enable automatic timestamps (createdAt and updatedAt)
  });
  return Response;
};