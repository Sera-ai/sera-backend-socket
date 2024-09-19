import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyFormbody from '@fastify/formbody';
import fastifyExpress from '@fastify/express';

import { WebSocketServer } from 'ws';

import { connectDatabase } from './src/handlers/mongoHandler.js';
import { setupSocketHandlers } from './src/handlers/socketHandler.js';


const mongoString = process.env.DB_HOST;
const app = Fastify();

(async () => {
  const { streams, toastables } = await connectDatabase(mongoString);

  // Register plugins
  await app.register(cors, { origin: '*' });
  await app.register(fastifyFormbody);
  await app.register(fastifyExpress); // for socket.io compatibility

  const port = process.env.BE_SOCKET_PORT;

  // Start the Fastify server
  app.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`Socket server started at ${port}`);
  });

  // Initialize WebSocket server
  const server = app.server;
  const io = new WebSocketServer({
    server,
    path: '/sera-socket-io',
  });

  setupSocketHandlers(io, streams, toastables);
})();
