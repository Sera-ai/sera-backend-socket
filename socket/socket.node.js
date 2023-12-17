const nodesBuilder = require('../models/models.nodes');
const modelsBuilder = require('../models/models.builder');


async function create_node(node, builder, socket) {
    let newNode = node.newNode

    /*let fields = {}
    switch (node.newNode.type) {
        case "functionNode": fields["out"] = { [node.newNode.data.function]: { "type": node.newNode.data.function, "readOnly": true, "example": 1 } }
    }

    let newNode = node.newNode
    newNode.data["node_data"] = fields

    console.log("create node", newNode.data)

    const savedData = await new nodesBuilder(newNode.data).save()
    newNode["node_id"] = savedData._id;

    console.log("savedData", savedData)


    console.log("builker", newNode)


    socket.broadcast.to(builder).emit('nodeCreate', { newNode: newNode });*/

    delete newNode.data

    newNode["node_id"] = newNode.id;

    console.log("newNode",newNode)
    modelsBuilder.findByIdAndUpdate(builder, { $push: { "nodes": newNode } }, { new: true });

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
    console.log("node updated")
    console.log(node.nodes)
    modelsBuilder.findByIdAndUpdate(builder, { "nodes": node.nodes }).then((e) => { })
    socket.broadcast.to(builder).emit('nodeUpdate', { newNodes: node.newNodes });
}

function update_node_data(params, builder, socket) {

    const id = params.id.split("-")[1]
    console.log("updated node data", params.value)

    if (id) {
        console.log("id", id)
        console.log("params", params)
        nodesBuilder.findByIdAndUpdate(id, { inputData: params.value }).then((e) => { console.log("e", e) })

        socket.broadcast.to(builder).emit('updateField', params);
    }

}

module.exports = {
    create_node,
    delete_node,
    update_node,
    update_node_data
}