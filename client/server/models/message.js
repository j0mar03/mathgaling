'use strict';

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    from_user_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['teacher', 'student', 'parent', 'admin']]
      }
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    to_user_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['teacher', 'student', 'parent', 'admin']]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'messages',
    timestamps: true
  });

  Message.associate = function(models) {
    // Associations can be defined here
    // For example:
    // Message.belongsTo(models.Student, { foreignKey: 'to_user_id', constraints: false });
    // Message.belongsTo(models.Teacher, { foreignKey: 'from_user_id', constraints: false });
  };

  return Message;
}; 