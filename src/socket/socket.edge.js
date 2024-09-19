import { Types } from 'mongoose';

const { default: endpoint_builder_model } = await import("../models/models.endpoint_builder.cjs");
const { default: builder_node_model } = await import("../models/models.builder_node.cjs");
const { default: builder_edge_model } = await import("../models/models.builder_edge.cjs");

const { ObjectId } = Types;

function broadcastToBuilderClients(io, builderId, message) {
  io.clients.forEach(client => {
    console.log(client);
    if (client.builderId === builderId && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

export async function create_edge(data, io) {
  broadcastToBuilderClients(io, data.builder, { type: 'edgeCreate', edge: data.edge });
}

export function delete_edge(data, io) {
  console.log(data);
  broadcastToBuilderClients(io, data.builder, { type: 'edgeDelete', edge: data.edge });
}

export function update_edge(data, io) {
  broadcastToBuilderClients(io, data.builder, { type: 'edgeUpdate', edge: data.edge });
}

export async function connect_edge(params, builder, io) {
  let edges = params.edges;
  let edge = params.edge;

  console.log(params);
  edges.push(edge);

  const data = new builder_edge_model(edge);
  const dataToSave = await data.save();

  endpoint_builder_model.findByIdAndUpdate(builder, {
    $push: { edges: dataToSave._id },
  });
  broadcastToBuilderClients(io, builder, { type: 'onConnect', edge });

  const isScript = params.nodes.filter(
    (node) => params.edge.target === node.id && node.type === 'scriptNode'
  );
  console.log('script', isScript);
  if (isScript.length > 0) {
    isScript.map((script) => {
      builder_node_model
        .findOneAndUpdate(
          { id: script.id },
          { $push: { 'data.targets': params.edge.id } }
        )
        .then((e) => {
          console.log('e', e);

          broadcastToBuilderClients(io, builder, {
            type: 'updateField',
            id: isScript[0].id,
            data: e.data.targets,
            edge: true,
          });
        });
    });
  }
}
