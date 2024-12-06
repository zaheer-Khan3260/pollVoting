import { getIoInstance } from '../config/webSocket.js';

export const broadcastPollUpdate = (pollId, updateData) => {
  const io = getIoInstance();

  io.to(`poll-${pollId}`).emit('poll-update', updateData);
  console.log(`Broadcasted update to poll-${pollId}:`, updateData);
};