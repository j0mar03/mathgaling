'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Parent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Parent.belongsToMany(models.Student, {
        through: 'ParentStudent', // Name of the junction model/table
        foreignKey: 'parent_id',
        otherKey: 'student_id'
      });
    }
  }
  Parent.init({
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
    password: {
      type: DataTypes.STRING,
      allowNull: false // Password should be required for login
    }
    // createdAt and updatedAt are handled by Sequelize automatically
  }, {
    sequelize,
    modelName: 'Parent',
    tableName: 'parents', // Explicitly define table name
    timestamps: true // Enable automatic timestamps
  });
  return Parent;
};