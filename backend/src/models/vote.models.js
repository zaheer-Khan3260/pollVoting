import { DataTypes } from 'sequelize';
import database from '../config/database.js';

database.connect()

const Vote = database.sequelize.define('Vote', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  pollId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  optionId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  voterMetadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'votes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['pollId']
    }
  ]
});

// Associations
Vote.associate = (models) => {
  Vote.belongsTo(models.Poll, {
    foreignKey: 'pollId',
    as: 'poll'
  });
  Vote.belongsTo(models.PollOption, {
    foreignKey: 'optionId',
    as: 'option'
  });
};

export default Vote;