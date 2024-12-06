// models/index.js
import Poll from './poll.models.js';
import PollOption from './pollOption.models.js';
import Vote from './vote.models.js';

const models = {
  Poll,
  PollOption,
  Vote
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export default models;