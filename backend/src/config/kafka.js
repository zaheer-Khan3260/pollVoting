import { KafkaClient, Producer, Consumer } from 'kafka-node';

const kafkaConfig = {
  kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS,
};

// Kafka Producer
export const createKafkaProducer = () => {
  const client = new KafkaClient(kafkaConfig);
  const producer = new Producer(client);

  producer.on('ready', () => {
    console.log('Kafka Producer is ready.');
  });

  producer.on('error', (err) => {
    console.error('Kafka Producer Error:', err);
  });

  return producer;
};

// Kafka Consumer
export const createKafkaConsumer = (topic, groupId) => {
  const client = new KafkaClient(kafkaConfig);
  const consumer = new Consumer(
    client,
    [{ topic, partition: 0 }],
    {
      autoCommit: true,
      groupId,
    }
  );

  consumer.on('error', (err) => {
    console.error('Kafka Consumer Error:', err);
  });

  return consumer;
};
