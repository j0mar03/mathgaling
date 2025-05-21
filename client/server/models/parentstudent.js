'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ParentStudent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // No explicit associations needed here usually,
      // as they are defined in Parent and Student models using 'through'
    }
  }
  ParentStudent.init({
    parent_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Part of composite primary key
      allowNull: false,
      references: {
        model: 'parents', // Table name
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
    }
  }, {
    sequelize,
    modelName: 'ParentStudent',
    tableName: 'parent_students', // Explicitly define table name
    timestamps: false // Disable createdAt/updatedAt for this junction table
  });
  return ParentStudent;
};