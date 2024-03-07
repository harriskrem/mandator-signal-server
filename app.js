"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var node_http_1 = require("node:http");
var socket_io_1 = require("socket.io");
var app = (0, express_1.default)();
var server = (0, node_http_1.createServer)(app);
var io = new socket_io_1.Server(server);
app.get('/', function (req, res) {
    res.send('<h1>Hello world</h1>');
});
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('offer', function (data) {
        console.log('Received offer:', data);
        // Broadcast offer to all other clients except sender
        socket.broadcast.emit('offer', data);
    });
    // Handle 'answer' event
    socket.on('answer', function (data) {
        console.log('Received answer:', data);
        // Broadcast answer to all other clients except sender
        socket.broadcast.emit('answer', data);
    });
    // Handle 'ice-candidate' event
    socket.on('ice-candidate', function (data) {
        console.log('Received ICE candidate:', data);
        // Broadcast ICE candidate to all other clients except sender
        socket.broadcast.emit('ice-candidate', data);
    });
    // Handle disconnection
    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });
});
var PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
    console.log('server running at http://localhost:3000');
});
