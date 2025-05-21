'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClassroomStudent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations FROM this junction table
      ClassroomStudent.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'Student' // Optional: Define an alias if needed, matches include in routes
      });
      ClassroomStudent.belongsTo(models.Classroom, {
        foreignKey: 'classroom_id',
        as: 'Classroom' // Optional: Define an alias
      });
    }
  }
  ClassroomStudent.init({
    classroom_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Part of composite primary key
      allowNull: false,
      references: {
        model: 'classrooms', // Table name
        key: 'id'
      }
    },
    student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Part of composite primary key
      allowNull: false,
      references: {
        model: 'students', // Table name
        key: 'id'
      }
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ClassroomStudent',
    tableName: 'classroom_students', // Explicitly define table name
    timestamps: false // Disable createdAt/updatedAt for this junction table unless needed
    // If you want timestamps, set to true and remove defaultValue from joined_at
  });
  return ClassroomStudent;
};