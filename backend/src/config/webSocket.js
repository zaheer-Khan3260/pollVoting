import { Server as SocketIoServer } from 'socket.io';

let io;

export const initializeWebSocket = (server) => {
  io = new SocketIoServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    socket.on('join-poll', (pollId) => {
      socket.join(`poll-${pollId}`);
      console.log(`Client ${socket.id} joined poll room: poll-${pollId}`);
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });
  });
};

export const getIoInstance = () => {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return io;
};
