import database from "../config/database.js";
import { DataTypes } from "sequelize";

// First, ensure the database connection is established
database.connect();

const Poll = database.sequelize.define('Poll', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creator: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'polls',
  timestamps: true
});

// For associations, you might want to modify this approach
Poll.associate = (models) => {
  Poll.hasMany(models.PollOption, {
    foreignKey: 'pollId',
    as: 'options'
  });
};

export default Poll;