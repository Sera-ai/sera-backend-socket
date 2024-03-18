const modelsBuilder = require("../models/models.builder");
const modelsNodes = require("../models/models.nodes");
const modelsEdges = require("../models/models.edges");
const ObjectId = require("mongoose").Types.ObjectId;

async function create_edge(data, socket) {
  socket.broadcast.to(data.builder).emit("edgeCreate", data.edge);
}
function delete_edge(data, socket) {
  socket.broadcast.to(data.builder).emit("edgeDelete", data.edge);
}
function update_edge(data, socket) {
  socket.broadcast.to(data.builder).emit("edgeUpdate", data.edge);
}

async function connect_edge(params, builder, socket) {
  let edges = params.edges;

  let edge = params.edge;

  console.log(params);
  edges.push(edge);

  const data = new modelsEdges(edge);
  const dataToSave = await data.save();

  modelsBuilder.findByIdAndUpdate(builder, {
    $push: { edges: dataToSave._id },
  });
  socket.broadcast.to(builder).emit("onConnect", edge);

  const isScript = params.nodes.filter(
    (node) => params.edge.target == node.id && node.type == "scriptNode"
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

          socket.broadcast.to(builder).emit("updateField", {
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
