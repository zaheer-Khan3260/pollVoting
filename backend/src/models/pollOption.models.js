
import { DataTypes } from 'sequelize';
import database from '../config/database.js';

database.connect()
const PollOption = database.sequelize.define('PollOption', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  pollId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  voteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'poll_options',
  timestamps: true
});

// Association with Poll and Vote
PollOption.associate = (models) => {
  PollOption.belongsTo(models.Poll, {
    foreignKey: 'pollId',
    as: 'poll'
  });
  PollOption.hasMany(models.Vote, {
    foreignKey: 'optionId',
    as: 'votes'
  });
};

export default PollOption;
