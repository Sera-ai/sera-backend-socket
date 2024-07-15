const nodeEvents = require("../socket/socket.node");
const edgeEvents = require("../socket/socket.edge");
const SeraHosts = require("../models/models.hosts");

require("../models/models.oas")
require("../models/models.dns")

const setupSocketHandlers = (io, streams, toastables) => {

  const { eventStream, hostStream } = streams

  io.on('connection', (socket) => {
    console.log("Connected");

    let builder = null;
    socket.send(JSON.stringify({ type: "connectSuccessful", id: socket._socket._server._connectionKey }));

    socket.on('message', (message) => {
      const parsedMessage = JSON.parse(message);
      
      switch (parsedMessage.type) {
        case "builderConnect":
          console.log(parsedMessage)
          socket.builderId = parsedMessage.builder;
          break;
          
        case "backendConnect":
          console.log("builder connected");
          socket.send(JSON.stringify({ type: "connectSuccessful", id: socket._socket._server._connectionKey }));
          break;
          
        case "nodeCreated":
          nodeEvents.create_node(parsedMessage, io);
          break;

        case "nodeDeleted":
          nodeEvents.delete_node(parsedMessage, io);
          break;

        case "edgeCreated":
          console.log(parsedMessage);
          edgeEvents.create_edge(parsedMessage, io);
          break;

        case "edgeDeleted":
          console.log(parsedMessage)
          edgeEvents.delete_edge(parsedMessage, io);
          break;

        case "edgeUpdated":
          edgeEvents.update_edge(parsedMessage, io);
          break;

        case "nodeUpdate":
          nodeEvents.update_node(parsedMessage.node, builder, io);
          break;

        case "nodeDelete":
          nodeEvents.delete_node(parsedMessage.node, builder, io);
          break;

        case "onConnect":
          edgeEvents.connect_edge(parsedMessage.edge, builder, io);
          break;

        case "nodeCreate":
          nodeEvents.create_node(parsedMessage.node, builder, io);
          break;

        case "updateField":
          nodeEvents.update_node_data(parsedMessage, builder, io);
          break;

        case "mouseMove":
          const data = {
            id: socket._socket._server._connectionKey,
            x: parsedMessage?.params?.x,
            y: parsedMessage?.params?.y,
            color: parsedMessage?.params?.color,
          };
          // Broadcast the mouse move event
          io.clients.forEach(client => {
            if (client !== socket && client.builderId === builder) {
              client.send(JSON.stringify({ type: "mouseMoved", data }));
            }
          });
          break;
          
        case "disconnect":
          io.clients.forEach(client => {
            if (client !== socket && client.builderId === builder) {
              client.send(JSON.stringify({ type: "userDisconnected", id: socket._socket._server._connectionKey }));
            }
          });
          break;

        default:
          console.log('Unknown message type:', parsedMessage.type);
          break;
      }
    });

    socket.on('close', () => {
      io.clients.forEach(client => {
        if (client.builderId === builder) {
          client.send(JSON.stringify({ type: "userDisconnected", id: socket._socket._server._connectionKey }));
        }
      });
    });
  });

  eventStream.on("change", (change) => {
    if (change.operationType == "insert" || change.operationType == "delete") {
      const doc = change.fullDocument;
      console.log("boopiun")
      if (toastables.includes(doc.type)) {
        io.clients.forEach(client => {
          client.send(JSON.stringify({ type: "eventNotification", doc }));
        });
      }
    }
  });

  hostStream.on("change", (change) => {
    if (change.operationType === "insert") {
      if (toastables.includes("seraHostCreate")) {
        SeraHosts.find().populate(["oas_spec"]).limit(100).then((res) => {
          console.log(toastables);
          console.log("event sent");
          io.clients.forEach(client => {
            client.send(JSON.stringify({ type: "onHostDataChanged", res }));
          });
        });
      }
    }
  });
};

module.exports = { setupSocketHandlers };
