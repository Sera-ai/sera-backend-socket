const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const mongoString = process.env.DB_HOST;
const bodyParser = require("body-parser");
const SeraEvents = require("./models/models.seraEvents");
const SeraSettings = require("./models/models.sera_settings");

mongoose.connect(`${mongoString}/Sera`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const database = mongoose.connection;

let toastables = [];

database.on("error", (error) => {
  console.log(error);
  process.exit();
});
database.once("connected", () => {
  console.log("Database Connected");
  const app = express();

  SeraSettings.findOne({ user: "admin" }).then((doc) => {
    toastables = doc?.toastables || [];
  });

  const settingsStream = SeraSettings.watch();

  settingsStream.on("change", (change) => {
    console.log(change);
    toastables = change.updateDescription.updatedFields.toastables;
    console.log(toastables);
  });

  const eventStream = SeraEvents.watch();

  const http = require("http");
  const server = http.createServer(app);
  const { Server } = require("socket.io");
  const nodeEvents = require("./socket/socket.node");
  const edgeEvents = require("./socket/socket.edge");
  const io = new Server(server, {
    cors: { origin: "*" },
    path: "/sera-socket-io"
  });

  io.on("connection", (socket) => {
    let builder = null;
    console.log("SENDING");
    socket.emit("connectSuccessful", socket.id);
    socket.on("builderConnect", (builderId) => {
      builder = builderId;
      socket.join(builderId);
    });

    socket.on("backendConnect", () => {
      console.log("builder connected");
      socket.join("management");
      socket.emit("connectSuccessful", socket.id);
    });

    eventStream.on("change", (change) => {
      console.log(change);
      if (change.operationType == "insert") {
        const doc = change.fullDocument;
        if (toastables.includes(doc.type))
          socket.emit("eventNotification", doc);
      }
    });

    //new

    socket.on("nodeCreated", (data) => {
      nodeEvents.create_node(data, socket);
    });

    socket.on("nodeDeleted", (data) => nodeEvents.delete_node(data, socket));

    socket.on("edgeCreated", (data) => {
      edgeEvents.create_edge(data, socket);
    });

    socket.on("edgeDeleted", (data) => edgeEvents.delete_edge(data, socket));
    socket.on("edgeUpdated", (data) => edgeEvents.update_edge(data, socket));

    //old, need to update

    socket.on("nodeUpdate", (node) =>
      nodeEvents.update_node(node, builder, socket)
    );

    socket.on("nodeDelete", (node) =>
      nodeEvents.delete_node(node, builder, socket)
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
