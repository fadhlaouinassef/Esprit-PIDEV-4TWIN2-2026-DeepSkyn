import { Server as IOServer } from 'socket.io';
import { setIO } from '../../lib/socket-io';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handleSocket = (req, res) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io');
    const httpServer = res.socket.server;
    const io = new IOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    res.socket.server.io = io;
    setIO(io);

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  } else {
    console.log('socket.io already running');
  }
  res.end();
};

export default handleSocket;
