import * as nodeEvents from '../socket/socket.node.js';
import * as edgeEvents from '../socket/socket.edge.js';

const { default: event_builder_model } = await import("../models/models.event_builder.cjs");
const { default: sera_events_model } = await import("../models/models.sera_events.cjs");
const { default: hosts_model } = await import("../models/models.hosts.cjs");
const { default: builder_node_model } = await import("../models/models.builder_node.cjs");
const { default: builder_edge_model } = await import("../models/models.builder_edge.cjs");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // For development only

export const setupSocketHandlers = (io, streams, toastables) => {
  const { eventStream, hostStream, nginxStream } = streams;

  io.on('connection', (socket) => {
    console.log('Connected');

    let builder = null;
    socket.send(JSON.stringify({ type: 'connectSuccessful', id: socket._socket._server._connectionKey }));

    socket.on('message', (message) => {
      const parsedMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case 'builderConnect':
          console.log(parsedMessage);
          socket.builderId = parsedMessage.builder;
          break;

        case 'backendConnect':
          console.log('builder connected');
          socket.send(JSON.stringify({ type: 'connectSuccessful', id: socket._socket._server._connectionKey }));
          break;

        case 'nodeCreated':
          nodeEvents.create_node(parsedMessage, io);
          break;

        case 'nodeDeleted':
          nodeEvents.delete_node(parsedMessage, io);
          break;

        case 'edgeCreated':
          console.log(parsedMessage);
          edgeEvents.create_edge(parsedMessage, io);
          break;

        case 'edgeDeleted':
          console.log(parsedMessage);
          edgeEvents.delete_edge(parsedMessage, io);
          break;

        case 'edgeUpdated':
          edgeEvents.update_edge(parsedMessage, io);
          break;

        case 'nodeUpdate':
          nodeEvents.update_node(parsedMessage.node, builder, io);
          break;

        case 'nodeDelete':
          nodeEvents.delete_node(parsedMessage.node, builder, io);
          break;

        case 'onConnect':
          edgeEvents.connect_edge(parsedMessage.edge, builder, io);
          break;

        case 'nodeCreate':
          nodeEvents.create_node(parsedMessage.node, builder, io);
          break;

        case 'updateField':
          nodeEvents.update_node_data(parsedMessage, builder, io);
          break;

        case 'mouseMove':
          const data = {
            id: socket._socket._server._connectionKey,
            x: parsedMessage?.params?.x,
            y: parsedMessage?.params?.y,
            color: parsedMessage?.params?.color,
          };
          // Broadcast the mouse move event
          io.clients.forEach((client) => {
            if (client !== socket && client.builderId === builder) {
              client.send(JSON.stringify({ type: 'mouseMoved', data }));
            }
          });
          break;

        case 'disconnect':
          io.clients.forEach((client) => {
            if (client !== socket && client.builderId === builder) {
              client.send(JSON.stringify({ type: 'userDisconnected', id: socket._socket._server._connectionKey }));
            }
          });
          break;

        default:
          console.log('Unknown message type:', parsedMessage.type);
          break;
      }
    });

    socket.on('close', () => {
      io.clients.forEach((client) => {
        if (client.builderId === builder) {
          client.send(JSON.stringify({ type: 'userDisconnected', id: socket._socket._server._connectionKey }));
        }
      });
    });
  });

  eventStream.on('change', (change) => {
    if (change.operationType == 'insert' || change.operationType == 'delete') {
      console.log('boop');
      const doc = change.fullDocument;
      if (toastables.includes(doc.type)) {
        io.clients.forEach((client) => {
          client.send(JSON.stringify({ type: 'eventNotification', doc }));
        });
      }
      builder_node_model.findOne({ 'data.inputData': doc.type, type: 'eventNode' }).then((result) => {
        if (!result) {
          console.error('No inputData Result');
          console.error(doc.type);
          return;
        }

        if (result) {
          event_builder_model.findOne({ nodes: { $in: [result._id] } }).then((eventResult) => {
            if (!eventResult) {
              console.error('No event_builder_model Result');
              console.log(result._id);
              return;
            }

            fetch(`http://127.0.0.1:12060/events/${eventResult._id}/${result.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-sera-service': 'be_builder',
              },
              body: JSON.stringify(doc.data),
            });
          });
        } else {
          console.log('No matching node found.');
        }
      });
    }
  });

  hostStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      hosts_model.find().populate(['oas_spec']).limit(100).then((res) => {
        console.log(toastables);
        console.log('event sent');
        io.clients.forEach((client) => {
          client.send(JSON.stringify({ type: 'onHostDataChanged', res }));
        });
      });
      if (toastables.includes('seraHostCreate')) { }
    }
  });

  nginxStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const doc = change.fullDocument;
      if (doc.response_time > 3000) {
        sera_events_model.create({
          event: 'sera',
          type: 'seraRoundTripTime',
          srcIp: doc.session_analytics.ip_address,
          data: {
            endpoint: doc.hostname + doc.path,
            requestData: doc.request,
            totalTime: doc.response_time,
            builderId: 'nil',
            timestamp: new Date().getTime(),
          },
        });
      }
    }
  });
};
