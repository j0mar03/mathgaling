'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Teacher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Teacher.hasMany(models.Classroom, { foreignKey: 'teacher_id' });
    }
  }
  Teacher.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true // Or false if required
    },
    auth_id: {
      type: DataTypes.STRING,
      allowNull: true, // Or false if required
      unique: true // Assuming auth_id should be unique
    },
    preferences: {
      type: DataTypes.JSONB, // Use JSONB for preferences
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false // Password should be required for login
    }
    // createdAt and updatedAt are handled by Sequelize automatically
  }, {
    sequelize,
    modelName: 'Teacher',
    tableName: 'teachers', // Explicitly define table name
    timestamps: true // Enable automatic timestamps
  });
  return Teacher;
};