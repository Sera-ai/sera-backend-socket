require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const bodyParser = require('body-parser');

mongoose.connect(mongoString, { dbName: "Sera" });
const database = mongoose.connection;

database.on('error', (error) => { console.log(error) })
database.once('connected', () => { console.log('Database Connected'); })

const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const nodeEvents = require('./socket/socket.node');
const edgeEvents = require('./socket/socket.edge');
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    let builder = null
    socket.send("connect", socket.id)
    socket.on("builderConnect", (builderId) => {
        builder = builderId
        socket.join(builderId)
    })

    socket.on("nodeUpdate", (node) => nodeEvents.update_node(node, builder, socket));
    socket.on("nodeCreate", (node) => nodeEvents.create_node(node, builder, socket));
    socket.on("nodeDelete", (node) => nodeEvents.delete_node(node, builder, socket));

    socket.on("edgeUpdate", (edge) => edgeEvents.update_edge(edge, builder, socket))
    socket.on("onConnect", (edge) => edgeEvents.connect_edge(edge, builder, socket))

    socket.on("getId", () => { socket.emit('gotId', socket.id); })

    socket.on("updateField", (params) => { socket.broadcast.to(builder).emit('updateField', params); })

    socket.on("mouseMove", (params) => {
        const data = { id: socket.id, x: params.x, y: params.y, color: params.color }
        socket.broadcast.to(builder).emit('mouseMoved', data);
    })

    socket.on('disconnect', () => {
        socket.broadcast.to(builder).emit('userDisconnected', socket.id);
    });
});

app.use(cors(), express.json(), bodyParser.urlencoded({ extended: true }), bodyParser.json());
server.listen(process.env.PORT, () => {
    console.log(`Socket server Started at ${process.env.PORT}`)
})