import express from 'express';
import { createServer } from 'node:https';
import { Server } from 'socket.io';
import fs from 'fs';

const options = {
  key: fs.readFileSync('C:\\Users\\harri\\certs\\vite_localhost\\server.key'), // replace it with your key path
  cert: fs.readFileSync('C:\\Users\\harri\\certs\\vite_localhost\\server.crt'), // replace it with your certificate path
};

const app = express();
const server = createServer(options, app);
const io = new Server(server);


app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

let connections: string[] = [];

io.on('connection', (socket) => {
  console.log('a user connected: ', socket.id);

  for (const [key] of io.sockets.sockets) {
    connections.push(key);
  }

  socket.on('share_id', ({ peerId }: { peerId: string }) => {
    socket.to(peerId).emit('get_id', { peerId: socket.id });
  });

  socket.on('send_candidate', ({ candidate, peerId }: { candidate: unknown, peerId: string }) => {
    socket.to(peerId).emit("get_candidate", { candidate, peerId: socket.id });
  });

  socket.on('send_connection_offer', ({ offer, peerId }: { offer: RTCSessionDescriptionInit, peerId: string }) => {
    socket.to(peerId).emit('get_connection_offer', { offer, peerId: socket.id });
  });

  socket.on('answer', ({ answer, peerId }: { answer: RTCSessionDescriptionInit, peerId: string }) => {
    socket.to(peerId).emit('get_answer', { answer, peerId: socket.id });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    connections = connections.filter(connection => connection !== socket.id);
    console.log('A user disconnected');
  });

  // for debugging purposes 
  socket.onAny((eventName, ...args) => {
    console.log(eventName); // 'hello'
    console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
  });

  socket.onAnyOutgoing((eventName, ...args) => {
    console.log(eventName); // 'hello'
    console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('server running at https://localhost:3000');
});
