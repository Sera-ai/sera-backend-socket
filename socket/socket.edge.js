const modelsBuilder = require("../models/models.builder");
const modelsEdges = require("../models/models.edges");
const ObjectId = require('mongoose').Types.ObjectId;

function update_edge(params, builder, socket) {
  let edges = params.edges;
  let newEdges = params.newEdges;
  params.newEdges.map((changedEdge) => {
    if (changedEdge.type == "remove") {
      const matchingEdge = edges.find((edge) => edge.id === changedEdge.id);
      modelsBuilder.findByIdAndUpdate(
        builder,
        { $pull: { edges: new ObjectId(matchingEdge._id) } } // Correctly use $push to add to the array
      ).then((e)=>{console.log("e2",e)}).catch((e3)=>{console.log("3e",e3)})
    }
  });
  socket.broadcast.to(builder).emit("edgeUpdate", newEdges);
}

async function connect_edge(params, builder, socket) {
  let edges = params.edges;

  console.log(params)
  // Assuming params.edge is the new edge object to be added
  edges.push(params.edge);

  // Create a new edge document and save it
  const data = new modelsEdges(params.edge);
  const dataToSave = await data.save();

  // Use $push to add the new edge's ID to the 'edges' array of the specified builder document
  await modelsBuilder.findByIdAndUpdate(
    builder,
    { $push: { edges: dataToSave._id } } // Correctly use $push to add to the array
  );

  // Broadcast the new edge to the specified room
  socket.broadcast.to(builder).emit("onConnect", params.edge);
}

module.exports = {
  update_edge,
  connect_edge,
};
