const nodesBuilder = require('../models/models.nodes');
const modelsBuilder = require('../models/models.builder');


async function create_node(node, builder, socket) {
    let fields = {}
    switch (node.newNode.type) {
        case "functionNode": fields["out"] = { "integer": { "type": "integer", "readOnly": true, "example": 1 } }
    }

    let newNode = node.newNode
    newNode.data["node_data"] = fields

    const savedData = await new nodesBuilder(newNode.data).save()
    newNode["node_id"] = savedData._id;

    let builderNode = newNode
    delete builderNode.data

    modelsBuilder.findByIdAndUpdate(builder, { $push: { "nodes": builderNode } }, { new: true });

    socket.broadcast.to(builder).emit('nodeCreate', { newNode: newNode });
}


function delete_node(nodes, builder, socket) {
    nodes.map((node) => {
        modelsBuilder.findByIdAndUpdate(builder, { $pull: { nodes: { id: node.id } } }).then((e) => { console.log(e) })
        nodesBuilder.findByIdAndDelete(node.node_id)
    })
    socket.broadcast.to(builder).emit('nodeDelete', nodes);
}

function update_node(node, builder, socket) {
    node.nodes.map((nod) => {
        delete nod.data
    })
    modelsBuilder.findByIdAndUpdate(builder, { "nodes": node.nodes }).then((e) => { })
    socket.broadcast.to(builder).emit('nodeUpdate', { newNodes: node.newNodes });
}

module.exports = {
    create_node,
    delete_node,
    update_node
}