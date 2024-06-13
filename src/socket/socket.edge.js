const modelsBuilder = require("../models/models.builder");
const modelsNodes = require("../models/models.nodes");
const modelsStruc = require("../models/models.eventStruc");
const modelsEdges = require("../models/models.edges");
const ObjectId = require("mongoose").Types.ObjectId;

function broadcastToBuilderClients(io, builderId, message) {
  io.clients.forEach(client => {
    console.log(client)
    if (client.builderId === builderId && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

async function create_edge(data, io) {
  broadcastToBuilderClients(io, data.builder, { type: "edgeCreate", edge: data.edge });
}

function delete_edge(data, io) {
  console.log(data)
  broadcastToBuilderClients(io, data.builder, { type: "edgeDelete", edge: data.edge });
}

function update_edge(data, io) {
  broadcastToBuilderClients(io, data.builder, { type: "edgeUpdate", edge: data.edge });
}

async function connect_edge(params, builder, io) {
  let edges = params.edges;
  let edge = params.edge;

  console.log(params);
  edges.push(edge);

  const data = new modelsEdges(edge);
  const dataToSave = await data.save();

  modelsBuilder.findByIdAndUpdate(builder, {
    $push: { edges: dataToSave._id },
  });
  broadcastToBuilderClients(io, builder, { type: "onConnect", edge });

  const isScript = params.nodes.filter(
    (node) => params.edge.target === node.id && node.type === "scriptNode"
  );
  console.log("script", isScript);
  if (isScript.length > 0) {
    isScript.map((script) => {
      modelsNodes
        .findOneAndUpdate(
          { id: script.id },
          { $push: { "data.targets": params.edge.id } }
        )
        .then((e) => {
          console.log("e", e);

          broadcastToBuilderClients(io, builder, {
            type: "updateField",
            id: isScript[0].id,
            data: e.data.targets,
            edge: true,
          });
        });
    });
  }
}

module.exports = {
  update_edge,
  connect_edge,
  create_edge,
  delete_edge,
};
