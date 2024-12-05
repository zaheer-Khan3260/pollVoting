import { KafkaClient, Producer } from 'kafka-node';

// Initialize Kafka client and producer
const kafkaProducer = () => {
  if (!process.env.KAFKA_BOOTSTRAP_SERVERS) {
    throw new Error('KAFKA_BOOTSTRAP_SERVERS environment variable is not set.');
  }

  const client = new KafkaClient({
    kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS,
  });

  const producer = new Producer(client);

  // Handle producer ready and error events
  producer.on('ready', () => {
    console.log('Kafka Producer is ready.');
  });

  producer.on('error', (error) => {
    console.error('Kafka Producer Error:', error);
  });

  // Function to send a vote message
  const sendVote = async (pollId, vote) => {
    if (!pollId || !vote) {
      throw new Error('pollId and vote are required to send a message.');
    }

    const payloads = [
      {
        topic: 'poll-votes', // Topic to send messages to
        messages: JSON.stringify({ pollId, vote }),
      },
    ];

    return new Promise((resolve, reject) => {
      producer.send(payloads, (err, data) => {
        if (err) {
          console.error('Error sending Kafka message:', err);
          return reject(err);
        }
        console.log('Kafka message sent successfully:', data);
        resolve(data);
      });
    });
  };

  return {
    sendVote,
  };
};

export default kafkaProducer;
