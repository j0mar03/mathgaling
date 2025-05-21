'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Student extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association with Parent through ParentStudent
      Student.belongsToMany(models.Parent, {
        through: 'ParentStudent', // Name of the junction model/table
        foreignKey: 'student_id', // Foreign key in ParentStudent referencing Student
        otherKey: 'parent_id'     // Foreign key in ParentStudent referencing Parent
      });

      // Example: Student.hasMany(models.Response, { foreignKey: 'student_id' });
      // Add other associations here if needed
    }
  }
  Student.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true // Or false if name is required
    },
    auth_id: {
      type: DataTypes.STRING,
      allowNull: true, // Or false if required, depends on auth strategy
      unique: true // Assuming auth_id should be unique
    },
    grade_level: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    language_preference: {
      type: DataTypes.STRING,
      defaultValue: 'English',
      allowNull: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB, // Use JSONB for PostgreSQL
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false // Password should be required for login
    }
    // createdAt and updatedAt are handled by Sequelize automatically (timestamps: true)
  }, {
    sequelize,
    modelName: 'Student',
    tableName: 'students', // Explicitly define table name
    timestamps: true // Enable automatic timestamps
  });
  return Student;
};