const { default: event_struc_model } = await import("../models/models.event_struc.cjs");
const { default: builder_node_model } = await import("../models/models.builder_node.cjs");

function broadcastToBuilderClients(io, builderId, message) {
  io.clients.forEach(client => {
    if (client.builderId === builderId && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

export function create_node(data, io) {
  broadcastToBuilderClients(io, data.builder, { type: 'nodeCreate', node: data.node });
}

export function delete_node(data, io) {
  console.log(data);
  broadcastToBuilderClients(io, data.builder, { type: 'nodeDelete', node: data.node });
}

export function update_node(node, builder, io) {
  node.map((nod) => {
    console.log(nod);
    builder_node_model
      .findOneAndUpdate(
        { id: nod.id },
        { position: nod.position, positionAboslute: nod.positionAboslute }
      )
      .then((r) => console.log(r));
  });
  broadcastToBuilderClients(io, builder, { type: 'nodeUpdate', node });
}

export async function update_node_data(params, builder, io) {
  console.log('type', params);
  if (params?.node?.type !== 'sendEventNode') {
    builder_node_model
      .findOneAndUpdate({ id: params.id }, { [params.field]: params.data })
      .then((e) => {
        console.log('e', e);
      });

    broadcastToBuilderClients(io, builder, { type: 'updateField', params });
  } else {
    const updatedNode = await builder_node_model.findOneAndUpdate(
      { id: params.node.id },
      { 'data.inputData': params.value },
      { new: true } // This option returns the updated document
    );
    event_struc_model
      .findByIdAndUpdate(updatedNode.data.struc_id, { type: params.value })
      .then((e) => {
        console.log('e', e);
      });
  }
}

export function generateRandomString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}
