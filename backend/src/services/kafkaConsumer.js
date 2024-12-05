import { KafkaClient, Consumer } from 'kafka-node';
import { Poll } from '../models/poll.models,js';
import { PollOption } from '../models/pollOption.models.js';
import { Vote } from '../models/vote.models.js'; 

const kafkaConsumer = () => {
  if (!process.env.KAFKA_BOOTSTRAP_SERVERS) {
    throw new Error('KAFKA_BOOTSTRAP_SERVERS environment variable is not set.');
  }

  const client = new KafkaClient({
    kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS,
  });

  const consumer = new Consumer(client, [
    { topic: 'poll-votes', partition: 0 },
  ], {
    autoCommit: true,
    groupId: 'poll-votes-group',
  });

  consumer.on('message', async (message) => {
    try {
      const { pollId, vote } = JSON.parse(message.value);

      const pollOption = await PollOption.findByPk(vote.optionId);

      if (pollOption) {
        await Vote.create({
          pollId,
          optionId: vote.optionId,
        });

        await updatePollResults(pollId);
      }

    } catch (error) {
      console.error('Error processing Kafka message:', error);
    }
  });

  consumer.on('error', (error) => {
    console.error('Kafka Consumer Error:', error);
  });

  // Update poll results after processing votes
  const updatePollResults = async (pollId) => {
    try {
      const poll = await Poll.findByPk(pollId, {
        include: [
          {
            model: PollOption,
            as: 'options',
            include: [{ model: Vote, as: 'votes' }],
          },
        ],
      });

      if (poll) {
        // Aggregate votes for each option and calculate percentages
        const totalVotes = poll.options.reduce((sum, option) => sum + option.voteCount, 0);

        const processedResults = poll.options.map((option) => ({
          id: option.id,
          text: option.text,
          voteCount: option.voteCount,
          percentage: totalVotes > 0 ? ((option.voteCount / totalVotes) * 100).toFixed(2) : 0,
        }));

        WebSocketService.broadcastPollUpdate(poll);
      }
    } catch (error) {
      console.error('Error updating poll results:', error);
    }
  };

  return {
    consumer,
  };
};

export default kafkaConsumer;
