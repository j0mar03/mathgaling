'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Classroom extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Classroom.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
      // Association to Students through the junction table ClassroomStudent
      Classroom.belongsToMany(models.Student, {
        through: 'ClassroomStudent', // Name of the junction model/table
        foreignKey: 'classroom_id',
        otherKey: 'student_id'
      });
    }
  }
  Classroom.init({
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
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Or false if a classroom must have a teacher
      references: {
        model: 'teachers', // Table name
        key: 'id'
      }
    },
    settings: {
      type: DataTypes.JSONB, // Use JSONB for settings
      allowNull: true
    }
    // createdAt and updatedAt are handled by Sequelize automatically
  }, {
    sequelize,
    modelName: 'Classroom',
    tableName: 'classrooms', // Explicitly define table name
    timestamps: true // Enable automatic timestamps
  });
  return Classroom;
};