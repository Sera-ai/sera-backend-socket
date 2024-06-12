const nodeEvents = require("../socket/socket.node");
const edgeEvents = require("../socket/socket.edge");
const SeraHosts = require("../models/models.hosts");

require("../models/models.oas")
require("../models/models.dns")

const setupSocketHandlers = (io, streams, toastables) => {

  const { eventStream, hostStream } = streams

  io.on("connection", (socket) => {
    console.log("Connected")
    let builder = null;
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
      if (change.operationType == "insert" || change.operationType == "delete") {
        const doc = change.fullDocument;
        if (toastables.includes(doc.type)) {
          socket.emit("eventNotification", doc);
        }
      }
    });

    hostStream.on("change", (change) => {
      if (change.operationType === "insert") {
        if (toastables.includes("seraHostCreate")) SeraHosts.find().populate(["oas_spec"]).limit(100).then((res) => {
          console.log(toastables)
          console.log("event sent")
          socket.emit("onHostDataChanged", res);
        })
      }
    });



    // New socket event handlers
    socket.on("nodeCreated", (data) => {
      nodeEvents.create_node(data, socket);
    });

    socket.on("nodeDeleted", (data) => nodeEvents.delete_node(data, socket));

    socket.on("edgeCreated", (data) => {
      console.log(data)
      edgeEvents.create_edge(data, socket);
    });

    socket.on("edgeDeleted", (data) => edgeEvents.delete_edge(data, socket));
    socket.on("edgeUpdated", (data) => edgeEvents.update_edge(data, socket));

    // Old socket event handlers (need to update)
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
};

module.exports = { setupSocketHandlers };
