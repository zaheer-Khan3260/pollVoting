import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import database from './config/database.js';
import { WebSocketService } from './services/websocketService.js';
import pollRoutes from './routes/poll.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
dotenv.config();

class AppServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.webSocketService = new WebSocketService(this.server); // Use WebSocketService

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
      database.connect();

      const isConnected = await database.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      if (process.env.NODE_ENV === 'development') {
        await database.syncModels();
      }

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

        this.server.close(() => {
          console.log('HTTP server closed.');
        });

        await database.close();

        this.webSocketService.io.close(() => {
          console.log('WebSocket connections closed.');
        });

        process.exit(0);
      });
    });
  }
}

const app = new AppServer();
app.start();
app.setupGracefulShutdown();
