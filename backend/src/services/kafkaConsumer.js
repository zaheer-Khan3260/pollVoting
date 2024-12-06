import { Kafka } from 'kafkajs';
import  Poll  from '../models/poll.models.js';
import  PollOption  from '../models/pollOption.models.js';
import  Vote  from '../models/vote.models.js';
import { broadcastPollUpdate}  from '../services/webSocketService.js'; // Adjust import as needed

const createKafkaConsumer = () => {
  // Validate Kafka bootstrap servers
  if (!process.env.KAFKA_BOOTSTRAP_SERVERS) {
    throw new Error('KAFKA_BOOTSTRAP_SERVERS environment variable is not set.');
  }

  // Create Kafka client
  const kafka = new Kafka({
    clientId: 'poll-voting-consumer',
    brokers: process.env.KAFKA_BOOTSTRAP_SERVERS.split(','),
    connectionTimeout: 10000,
    requestTimeout: 60000,
  });

  // Create consumer
  const consumer = kafka.consumer({ 
    groupId: 'poll-votes-group',
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  // Connect method
  const connect = async () => {
    try {
      await consumer.connect();
      console.log('Kafka Consumer connected successfully');
    } catch (error) {
      console.error('Failed to connect Kafka Consumer:', error);
      throw error;
    }
  };

  // Subscribe to topic
  const subscribe = async () => {
    try {
      await consumer.subscribe({ 
        topic: 'poll-votes', 
        fromBeginning: false 
      });
      console.log('Subscribed to poll-votes topic');
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  };

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
          percentage: totalVotes > 0 
            ? ((option.voteCount / totalVotes) * 100).toFixed(2) 
            : 0,
        }));

        broadcastPollUpdate(poll);

        return processedResults;
      }
    } catch (error) {
      console.error('Error updating poll results:', error);
      throw error;
    }
  };

  // Start consuming messages
  const start = async () => {
    await connect();
    await subscribe();

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const { pollId, optionId } = JSON.parse(message.value.toString());

          const pollOption = await PollOption.findByPk(optionId);

          if (pollOption) {
            const vote = await Vote.create({
              pollId,
              optionId,
            });

            await updatePollResults(pollId);

            console.log(`Processed vote for poll ${pollId}, option ${optionId}`);
          }
        } catch (error) {
          console.error('Error processing Kafka message:', error);
          // Implement error handling strategy (retry, dead letter queue, etc.)
        }
      },
    });
  };

  const stop = async () => {
    try {
      await consumer.stop();
      await consumer.disconnect();
      console.log('Kafka Consumer stopped');
    } catch (error) {
      console.error('Error stopping Kafka Consumer:', error);
    }
  };

  return {
    connect,
    subscribe,
    start,
    stop,
  };
};

export default createKafkaConsumer;