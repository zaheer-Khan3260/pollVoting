import models from "../models/index.js"
import database from "../config/database.js";
import createKafkaProducer from "../services/kafkaProducer.js"

const kafkaProducer = createKafkaProducer();
const s = database.sequelize
export const createPoll = async (req, res) => {
  const t = await s.transaction();
  try {
    const { title, description, options, creator } = req.body;

    // Create poll
    const poll = await models.Poll.create(
      {
        title,
        description,
        creator,
      },
      { transaction: t }
    );

    // Create poll options
    const pollOptions = await models.PollOption.bulkCreate(
      options.map((option) => ({
        pollId: poll.id,
        text: option,
      })),
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      poll,
      options: pollOptions,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating poll:', error);
    res.status(500).json({ error: error.message });
  }
};



export const generateVote = async (req, res) => {
  const transaction = await database.sequelize.transaction();

  try {
    const { pollId, optionId } = req.body;

    if (!pollId || !optionId) {
      return res.status(400).json({ error: 'Poll ID and Option ID are required' });
    }

    // Find the poll and validate the option
    const poll = await models.Poll.findByPk(pollId, {
      include: [
        {
          model: models.PollOption,
          as: 'options',
          where: { id: optionId },
        },
      ],
      transaction,
    });

    if (!poll) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Poll or Option not found' });
    }

    if (!poll.isActive) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Poll is no longer active' });
    }

    // Send the vote to Kafka
    const connectKafka = await kafkaProducer.connect();
    const messageSentToKafka = await kafkaProducer.sendVote(pollId, optionId);

    if (!messageSentToKafka) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Failed to send vote to Kafka' });
    }

    // Acknowledge the vote to the client
    res.status(202).json({ message: 'Vote queued for processing' });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error processing vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await models.Poll.findByPk(pollId, {
      include: [
        {
          model: models.PollOption,
          as: 'options',
          include: [
            {
              model: models.Vote,
              as: 'votes',
            },
          ],
        },
      ],
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Calculate vote percentages
    const totalVotes = poll.options.reduce((sum, option) => sum + option.voteCount, 0);

    const processedResults = poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      voteCount: option.voteCount,
      percentage: totalVotes > 0 ? ((option.voteCount / totalVotes) * 100).toFixed(2) : 0,
    }));

    res.json({
      poll,
      results: processedResults,
      totalVotes,
    });
  } catch (error) {
    console.error('Error fetching poll results:', error); // Improved error logging
    res.status(500).json({ error: error.message });
  }
};