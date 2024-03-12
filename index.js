const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const mongoString = process.env.DB_HOST;
const bodyParser = require("body-parser");

mongoose.connect(`${mongoString}/Sera`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
  process.exit();
});
database.once("connected", () => {
  console.log("Database Connected");
  const app = express();

  const http = require("http");
  const server = http.createServer(app);
  const { Server } = require("socket.io");
  const nodeEvents = require("./socket/socket.node");
  const edgeEvents = require("./socket/socket.edge");
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("connect");
    let builder = null;
    socket.send("connect", socket.id);
    socket.on("builderConnect", (builderId) => {
      builder = builderId;
      socket.join(builderId);
    });

    socket.on("backendConnect", () => {
      console.log("builder connected");
      socket.join("management");
    });

    socket.on("nodeCreated", (data) => {
      nodeEvents.create_node(data, socket);
    });

    socket.on("nodeUpdate", (node) =>
      nodeEvents.update_node(node, builder, socket)
    );

    socket.on("nodeDelete", (node) =>
      nodeEvents.delete_node(node, builder, socket)
    );

    socket.on("edgeUpdate", (edge) =>
      edgeEvents.update_edge(edge, builder, socket)
    );

    socket.on("onConnect", (edge) =>
      edgeEvents.connect_edge(edge, builder, socket)
    );

    socket.on("nodeCreate", (node) =>
      nodeEvents.create_node(node, builder, socket)
    );

    socket.on("updateField", (param) =>
      nodeEvents.update_node_data(param, builder, socket)
    );

    socket.on("mouseMove", (params) => {
      const data = {
        id: socket.id,
        x: params.x,
        y: params.y,
        color: params.color,
      };
      socket.broadcast.to(builder).emit("mouseMoved", data);
    });

    socket.on("disconnect", () => {
      socket.broadcast.to(builder).emit("userDisconnected", socket.id);
    });
  });

  app.use(
    cors(),
    express.json(),
    bodyParser.urlencoded({ extended: true }),
    bodyParser.json()
  );
  server.listen(process.env.BE_SOCKET_PORT, () => {
    console.log(`Socket server Started at ${process.env.BE_SOCKET_PORT}`);
  });
});
