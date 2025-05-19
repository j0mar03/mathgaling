'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['teacher', 'student', 'parent', 'admin']]
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['message', 'assignment', 'feedback', 'system', 'achievement']]
      }
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'notifications',
    timestamps: true
  });

  Notification.associate = function(models) {
    // Associations can be defined here
    // For example:
    // Notification.belongsTo(models.Student, { foreignKey: 'user_id', constraints: false });
  };

  return Notification;
}; 