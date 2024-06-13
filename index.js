require("dotenv").config();
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const fastifyFormbody = require("@fastify/formbody");
const { WebSocketServer } = require('ws');
const { connectDatabase } = require("./src/handlers/mongoHandler");
const { setupSocketHandlers } = require("./src/handlers/socketHandler");

const mongoString = process.env.DB_HOST;
const app = Fastify();

(async () => {
  const { streams, toastables } = await connectDatabase(mongoString);

  // Register plugins
  await app.register(cors, { origin: "*" });
  await app.register(fastifyFormbody);
  await app.register(require('@fastify/express')); // for socket.io compatibility

  const port = process.env.BE_SOCKET_PORT;

  // Start the Fastify server
  await app.listen({ port, host: '0.0.0.0' }, (err) => {
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
    path: "/sera-socket-io",
  });

  setupSocketHandlers(io, streams, toastables);
})();
