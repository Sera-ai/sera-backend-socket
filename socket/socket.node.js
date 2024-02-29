const nodesBuilder = require("../models/models.nodes");
const modelsBuilder = require("../models/models.builder");

async function create_node(node, builder, socket) {

}

function delete_node(nodes, builder, socket) {
  nodes.map((node) => {
    modelsBuilder
      .findByIdAndUpdate(builder, { $pull: { nodes: node.id } })
      .then((e) => {
        console.log(e);
      });
    nodesBuilder.findByIdAndDelete(node.id);
  });
  socket.broadcast.to(builder).emit("nodeDelete", nodes);
}

function update_node(node, builder, socket) {
  node.changedNodes.map((nod) => {
    nodesBuilder.findByIdAndUpdate(nod._id, nod).exec();
  });
  socket.broadcast
    .to(builder)
    .emit("nodeUpdate", { changedNodes: node.changedNodes });
}

function update_node_data(params, builder, socket) {
  const id = params.id.split("-")[1];
  console.log("updated node data", params.value);

  if (id) {
    console.log("id", id);
    console.log("params", params);
    nodesBuilder
      .findByIdAndUpdate(id, { inputData: params.value })
      .then((e) => {
        console.log("e", e);
      });

    socket.broadcast.to(builder).emit("updateField", params);
  }
}

module.exports = {
  create_node,
  delete_node,
  update_node,
  update_node_data,
};
