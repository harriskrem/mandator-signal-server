import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('offer', (data) => {
    console.log('Received offer:', data);
    // Broadcast offer to all other clients except sender
    socket.broadcast.emit('offer', data);
  });

  // Handle 'answer' event
  socket.on('answer', (data) => {
    console.log('Received answer:', data);
    // Broadcast answer to all other clients except sender
    socket.broadcast.emit('answer', data);
  });

  // Handle 'ice-candidate' event
  socket.on('ice-candidate', (data) => {
    console.log('Received ICE candidate:', data);
    // Broadcast ICE candidate to all other clients except sender
    socket.broadcast.emit('ice-candidate', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('server running at http://localhost:3000');
});
