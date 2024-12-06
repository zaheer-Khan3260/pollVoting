import { Kafka } from 'kafkajs';

const createKafkaProducer = () => {
  // Validate Kafka bootstrap servers
  if (!process.env.KAFKA_BOOTSTRAP_SERVERS) {
    throw new Error('KAFKA_BOOTSTRAP_SERVERS environment variable is not set.');
  }

  // Create Kafka client
  const kafka = new Kafka({
    clientId: 'poll-voting-app',
    brokers: process.env.KAFKA_BOOTSTRAP_SERVERS,
    connectionTimeout: 10000,
    requestTimeout: 60000,
  });

  // Create producer
  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
    retry: {
      initialRetryTime: 100,
      retries: 5,
      factor: 2, // Exponential backoff
      multiplier: 1.5,
    },
  });

  // Connect method
  const connect = async () => {
    try {
      await producer.connect();
      console.log('Kafka Producer connected successfully');
    } catch (error) {
      console.error('Failed to connect Kafka Producer:', error);
      throw error;
    }
  };

  // Send vote message
  const sendVote = async (pollId, optionId) => {
    // Validate inputs
    if (!pollId || !optionId) {
      throw new Error('pollId, optionId, and userId are required to send a message.');
    }

    try {
      // Send message to Kafka topic
      const result = await producer.send({
        topic: 'poll-votes',
        messages: [
          {
            key: `${pollId}`, 
            value: JSON.stringify({
              pollId,
              optionId,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log('Kafka message sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending Kafka message:', error);
      throw error;
    }
  };

  // Disconnect method
  const disconnect = async () => {
    try {
      await producer.disconnect();
      console.log('Kafka Producer disconnected');
    } catch (error) {
      console.error('Error disconnecting Kafka Producer:', error);
    }
  };

  return {
    connect,
    sendVote,
    disconnect,
  };
};

export default createKafkaProducer;