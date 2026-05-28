import http             from 'http';
import { connectDB }    from './config/db';
import { env }          from './config/env';
import app              from './app';
import { initSocketServer } from './socket/socket.server';

const httpServer = http.createServer(app);

// Initialize Socket.io on the same HTTP server
initSocketServer(httpServer);

const start = async (): Promise<void> => {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    console.log('VedaAI Backend running on http://localhost:' + env.PORT);
    console.log('Health: http://localhost:' + env.PORT + '/api/health');
    console.log('Env: ' + env.NODE_ENV);
  });
};

start().catch(err => {
  console.error('Server failed to start:', err.message);
  process.exit(1);
});