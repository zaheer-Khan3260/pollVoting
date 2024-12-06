import { Poll } from '../models/poll.models,js';
import { PollOption } from '../models/pollOption.models.js';
import { Vote } from '../models/vote.models.js'; 
import { createKafkaConsumer } from '../config/kafka.js';

const kafkaConsumer = createKafkaConsumer('poll-votes', 'poll-votes-group');

kafkaConsumer.on('message', async (message) => {
  try {
    const { pollId, vote } = JSON.parse(message.value);

    const pollOption = await PollOption.findByPk(vote.optionId);

    if (pollOption) {
      await pollOption.increment('voteCount');

      await Vote.create({
        pollId,
        optionId: vote.optionId,
      });
    }
    await updatePollResults(pollId);
    
  } catch (error) {
    console.error('Error processing Kafka message:', error);
  }
});


kafkaConsumer.on('error', (error) => {
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


export default kafkaConsumer;
