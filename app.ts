import express from 'express';
import { createServer } from 'node:https';
import { Server } from 'socket.io';
import fs from 'fs';

const options = {
  key: fs.readFileSync('/home/harriskr/certs/practice/server.key'), // replace it with your key path
  cert: fs.readFileSync('/home/harriskr/certs/practice/server.crt'), // replace it with your certificate path
};

const app = express();
const server = createServer(options, app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});


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
  console.log('server running at https://localhost:3000');
});
