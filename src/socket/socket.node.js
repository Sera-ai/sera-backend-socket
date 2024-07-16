const { default: mongoose } = require("mongoose");
const modelsEventStruc = require("../models/models.eventStruc");
const modelsNode = require("../models/models.nodes");

function broadcastToBuilderClients(io, builderId, message) {
  io.clients.forEach(client => {
    if (client.builderId === builderId && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function create_node(data, io) {
  broadcastToBuilderClients(io, data.builder, { type: "nodeCreate", node: data.node });
}

function delete_node(data, io) {
  console.log(data)
  broadcastToBuilderClients(io, data.builder, { type: "nodeDelete", node: data.node });
}

function update_node(node, builder, io) {
  node.map((nod) => {
    console.log(nod);
    modelsNode
      .findOneAndUpdate(
        { id: nod.id },
        { position: nod.position, positionAboslute: nod.positionAboslute }
      )
      .then((r) => console.log(r));
  });
  broadcastToBuilderClients(io, builder, { type: "nodeUpdate", node });
}

async function update_node_data(params, builder, io) {
  console.log(params.node.type)
  if (params?.node?.type !== "sendEventNode") {
    modelsNode
      .findOneAndUpdate({ id: params.id }, { [params.field]: params.data })
      .then((e) => {
        console.log("e", e);
      });

    broadcastToBuilderClients(io, builder, { type: "updateField", params });
  } else {
    console.log("params", params);
    const updatedNode = await modelsNode.findOneAndUpdate(
      { id: params.node.id },
      { "data.inputData": params.value },
      { new: true } // This option returns the updated document
    );
    console.log(updatedNode)
    modelsEventStruc
      .findByIdAndUpdate(updatedNode.data.struc_id, { type: params.value })
      .then((e) => {
        console.log("e", e);
      });
  }
}

module.exports = {
  create_node,
  delete_node,
  update_node,
  update_node_data,
};

function generateRandomString() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}
