import { Server as IOServer } from 'socket.io';

declare global {
  var io: IOServer | undefined;
}

export const getIO = (): IOServer | undefined => {
  return global.io;
};

export const setIO = (io: IOServer) => {
  global.io = io;
};
