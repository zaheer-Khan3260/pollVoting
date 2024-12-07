# Polling System Backend

## Project Overview
This is a high-concurrency polling system built with Node.js, Kafka, Zookeeper, PostgreSQL, and WebSockets. The application allows users to create polls, vote in real-time, and view dynamic leaderboards.

## Prerequisites
- Node.js (v16 or later)
- Docker and Docker Compose
- Git

## Technology Stack
- Backend: Node.js with Express
- Message Broker: Kafka (with Zookeeper)
- Database: PostgreSQL
- Real-Time Updates: WebSockets
- Containerization: Docker

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/polling-system-backend.git
cd polling-system-backend
```

### 2. Environment Configuration
Create a `.env` file in the project root with the following configurations:

```env
# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://polluser:pollpassword@localhost:5432/pollingdb

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CLIENT_ID=poll-voting-system
KAFKA_GROUP_ID=poll-votes-group

# Zookeeper Configuration
ZOOKEEPER_HOST=localhost
ZOOKEEPER_PORT=2181

# WebSocket Configuration
WEBSOCKET_PORT=8080
```

### 3. Installing Dependencies
```bash
npm install
```

### 4. Running with Docker Compose
```bash
# Start all services (Kafka, Zookeeper, PostgreSQL, Backend)
docker-compose up --build

# To stop services
docker-compose down
```

### 5. Database Setup
#### Migrations
```bash
# Run database migrations
npm run migrate
```

### 6. Manual Local Setup (Without Docker)
#### Start Zookeeper
```bash
zookeeper-server-start /path/to/zookeeper.properties
```

#### Start Kafka
```bash
kafka-server-start /path/to/server.properties
```

#### Start PostgreSQL
Ensure PostgreSQL is running and create the database:
```sql
CREATE DATABASE pollingdb;
CREATE USER polluser WITH PASSWORD 'pollpassword';
GRANT ALL PRIVILEGES ON DATABASE pollingdb TO polluser;
```

#### Run the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Polls
- `POST /polls`: Create a new poll
- `GET /polls/{id}`: Get poll details
- `POST /polls/{id}/vote`: Vote in a poll

### Leaderboard
- `GET /leaderboard`: Get global poll leaderboard

## WebSocket Events
- `poll_update`: Real-time poll result updates
- `leaderboard_update`: Real-time leaderboard updates



