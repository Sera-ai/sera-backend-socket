const modelsNode = require("../models/models.nodes");

function create_node(data, socket) {
  socket.broadcast.to(data.builder).emit("nodeCreate", data.node);
}

function delete_node(data, socket) {
  socket.broadcast.to(data.builder).emit("nodeDelete", data.node);
}

function update_node(node, builder, socket) {
  node.map((nod) => {
    console.log(nod);
    modelsNode
      .findOneAndUpdate(
        { id: nod.id },
        { position: nod.position, positionAboslute: nod.positionAboslute }
      )
      .then((r) => console.log(r));
  });
  socket.broadcast.to(builder).emit("nodeUpdate", node);
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
