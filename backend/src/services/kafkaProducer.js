import { createKafkaProducer } from '../config/kafka.js';

const kafkaProducer = createKafkaProducer();

export const sendVoteToKafka = async (pollId, vote) => {

  if (!pollId || !vote) {
    throw new Error('pollId and vote are required to send a message.');
  }

  const payloads = [
    {
      topic: 'poll-votes',
      messages: JSON.stringify({ pollId, vote }),
    },
  ];

  return new Promise((resolve, reject) => {
    kafkaProducer.send(payloads, (err, data) => {
      if (err) {
        console.error('Error sending vote to Kafka:', err);
        return reject(err);
      }
      console.log('Vote sent to Kafka successfully:', data);
      resolve(data);
    });
  });
};

export default kafkaProducer;
