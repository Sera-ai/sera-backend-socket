const nodesBuilder = require('../models/models.nodes');
const modelsBuilder = require('../models/models.builder');

function update_edge(params, builder, socket) {
    let edges = params.edges
    let newEdges = params.newEdges
    params.newEdges.map((edge) => {
        if (edge.type == "remove") {
            edges = edges.filter(item => item.id !== edge.id);
        }
    })

    modelsBuilder.findByIdAndUpdate(builder, { "edges": edges }).then((e) => { })
    socket.broadcast.to(builder).emit('edgeUpdate', newEdges);
}

function connect_edge(params, builder, socket) {
    let edges = params.edges

    edges.push(params.edge)
    modelsBuilder.findByIdAndUpdate(builder, { "edges": edges }).then((e) => { })
    socket.broadcast.to(builder).emit('onConnect', params.edge);
}

module.exports = {
    update_edge,
    connect_edge
}