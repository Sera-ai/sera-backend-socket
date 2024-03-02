const modelsNode = require("../models/models.nodes");
const modelsBuilder = require("../models/models.builder");
const mongoose = require("mongoose");

async function create_node(newNode, builder, socket) {
  const nodedata = new modelsNode(newNode);
  const savedData = await nodedata.save();

  modelsBuilder
    .findByIdAndUpdate(builder, {
      $push: { nodes: new mongoose.Types.ObjectId(savedData._id) },
    })
    .then((e) => {
      console.log("sending back to server ", builder);
      socket.broadcast.to(builder).emit("nodeCreate", { newNode: savedData });
    });
}

function delete_node(nodes, builder, socket) {
  nodes.map((node) => {
    modelsBuilder
      .findByIdAndUpdate(builder, {
        $pull: { nodes: new mongoose.Types.ObjectId(node._id) },
      })
      .then((e) => {
        console.log(e);
      });
    modelsNode.findByIdAndDelete(new mongoose.Types.ObjectId(node._id));
  });
  socket.broadcast.to(builder).emit("nodeDelete", nodes);
}

function update_node(node, builder, socket) {
  node.changedNodes.map((nod) => {
    console.log(nod);
    modelsNode
      .findOneAndUpdate(
        { id: nod.id },
        { position: nod.position, positionAboslute: nod.positionAboslute }
      )
      .then((r) => console.log(r));
  });
  socket.broadcast
    .to(builder)
    .emit("nodeUpdate", { changedNodes: node.changedNodes });
}

function update_node_data(params, builder, socket) {
  console.log("params", params);
  modelsNode
    .findOneAndUpdate({ id: params.id }, { [params.field]: params.data })
    .then((e) => {
      console.log("e", e);
    });

  socket.broadcast.to(builder).emit("updateField", params);
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
