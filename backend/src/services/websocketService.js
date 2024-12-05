import { Server as SocketIoServer } from 'socket.io';

export class WebSocketService {
  constructor(server) {
    if (!server) {
      throw new Error('Server instance is required to initialize WebSocketService.');
    }

    // Initialize socket.io
    this.io = new SocketIoServer(server);

    // Handle new connections
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle joining a poll room
      socket.on('join-poll', (pollId) => {
        if (pollId) {
          socket.join(`poll-${pollId}`);
          console.log(`Socket ${socket.id} joined room: poll-${pollId}`);
        } else {
          console.error('Poll ID is required to join a poll room.');
        }
      });

      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast updates to a specific poll room
  broadcastPollUpdate(poll) {
    if (!poll || !poll.id) {
      console.error('Invalid poll object provided for broadcasting:', poll);
      return;
    }

    // Broadcast to all clients in the poll room
    this.io.to(`poll-${poll.id}`).emit('poll-update', poll);
    console.log(`Broadcasted poll update to room: poll-${poll.id}`);
  }
}
