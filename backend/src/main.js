import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import database from './config/database.js';
import pollRoutes from './routes/poll.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import { initializeWebSocket } from './config/webSocket.js';
import { getIoInstance } from './config/webSocket.js';
import createKafkaConsumer from './services/kafkaConsumer.js';

dotenv.config();

class AppServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);

    // Initialize WebSocket
    initializeWebSocket(this.server);

    this.configureMiddleware();
    this.setupRoutes();
  }

  configureMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS configuration
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
  }

  setupRoutes() {
    this.app.use('/api/polls', pollRoutes);
    this.app.use('/api/leaderboard', leaderboardRoutes);

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {},
      });
    });
  }

  async start() {
    try {
      // Connect to the database
      database.connect();

      // Test database connection
      const isConnected = await database.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      // Synchronize database models
      if (process.env.NODE_ENV === 'development') {
        await database.syncModels(false, true);
      } else if (process.env.NODE_ENV === 'test') {
        await database.syncModels(true); 
      }

      // Start the server
      const PORT = process.env.PORT || 3000;
      this.server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const signals = ['SIGINT', 'SIGTERM'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`Received ${signal}. Shutting down gracefully.`);

        // Close HTTP server
        this.server.close(() => {
          console.log('HTTP server closed.');
        });

        // Close database connection
        await database.close();

        // Close WebSocket connections
        const io = getIoInstance();
        io.close(() => {
          console.log('WebSocket connections closed.');
        });

        process.exit(0);
      });
    });
  }
}

async function initializeKafkaConsumer() {
  try {
    // Create the Kafka consumer
    const kafkaConsumer = createKafkaConsumer();

    // Start consuming messages
    await kafkaConsumer.start();

    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Received SIGINT. Stopping Kafka consumer...');
      await kafkaConsumer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM. Stopping Kafka consumer...');
      await kafkaConsumer.stop();
      process.exit(0);
    });

    console.log('Kafka consumer initialized and running');
  } catch (error) {
    console.error('Failed to initialize Kafka consumer:', error);
    process.exit(1);
  }
}

const app = new AppServer();
app.start();
initializeKafkaConsumer();
app.setupGracefulShutdown();
