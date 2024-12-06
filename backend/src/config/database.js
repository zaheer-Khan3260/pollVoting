import { Sequelize } from 'sequelize';

class Database {
  constructor() {
    this.sequelize = null;
  }

  connect() {
    if (this.sequelize) {
      console.log('Database connection already established.');
      return; // Prevent re-initializing the connection
    }

    // Use PostgreSQL URL for connection
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable is not set.');
      process.exit(1); // Exit the process if URL is missing
    }

    // Configuration for Sequelize
    const dbConfig = {
      logging: process.env.NODE_ENV === 'development' ? console.log : false,

      // Connection pool configuration
      pool: {
        max: 10,       
        min: 0,         
        acquire: 30000, 
        idle: 10000     
      },

      ...(process.env.NODE_ENV === 'production' && {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false // Set to `true` for stricter SSL validation
          }
        }
      })
    };

    // Initialize Sequelize connection with the URL
    this.sequelize = new Sequelize(databaseUrl, {
      ...dbConfig,
      dialect: 'postgres'
    });
  }

  // Test database connection
  async testConnection() {
    try {
      await this.sequelize.authenticate();
      console.log('PostgreSQL database connection established successfully.');
      return true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      return false;
    }
  }

  // Sync models (optional - use with caution in production)
  async syncModels(force = false, alter = false) {
    try {
      await this.sequelize.sync({ 
        force,  
        alter  
      });
      console.log('Models synchronized successfully.');
    } catch (error) {
      console.error('Error synchronizing models:', error);
    }
  }

  // Close database connection
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('Database connection closed.');
    }
  }
}

// Singleton instance
const database = new Database();

export default database;