const modelsBuilder = require("../models/models.builder");
const modelsNodes = require("../models/models.nodes");
const modelsEdges = require("../models/models.edges");
const ObjectId = require("mongoose").Types.ObjectId;

function update_edge(params, builder, socket) {
  let edges = params.edges;
  let newEdges = params.newEdges;
  params.newEdges.map((changedEdge) => {
    if (changedEdge.type == "remove") {
      const matchingEdge = edges.find((edge) => edge.id === changedEdge.id);
      modelsBuilder
        .findByIdAndUpdate(
          builder,
          { $pull: { edges: new ObjectId(matchingEdge._id) } } // Correctly use $push to add to the array
        )
        .then((e) => {
          console.log("e2", e);
        })
        .catch((e3) => {
          console.log("3e", e3);
        });
    }
  });
  socket.broadcast.to(builder).emit("edgeUpdate", newEdges);
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
  console.log("script", isScript)
  if (isScript.length > 0) {
    isScript.map((script) => {
      modelsNodes
        .findOneAndUpdate(
          { id: script.id },
          { $push: { "data.targets": params.edge.id } }
        )
        .then((e) => {
          console.log("e", e);

          socket.broadcast
            .to(builder)
            .emit("updateField", {
              id: isScript[0].id,
              data: e.data.targets,
              edge: true
            });
        });
    });
  }
}

module.exports = {
  update_edge,
  connect_edge,
};

function generateRandomString() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}
