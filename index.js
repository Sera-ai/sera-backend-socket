require("dotenv").config();
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const { connectDatabase } = require("./handlers/mongoHandler");
const { setupSocketHandlers } = require("./handlers/socketHandler");

const mongoString = process.env.DB_HOST;
const app = express();

(async () => {
  const { eventStream, toastables } = await connectDatabase(mongoString);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
    path: "/sera-socket-io",
  });

  setupSocketHandlers(io, eventStream, toastables);

  app.use(
    cors(),
    express.json(),
    bodyParser.urlencoded({ extended: true }),
    bodyParser.json()
  );

  const port = process.env.BE_SOCKET_PORT;
  server.listen(port, () => {
    console.log(`Socket server started at ${port}`);
  });
})();
