import fs from 'node:fs';
import { createServer } from 'node:https';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';

dotenv.config();

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

const app = express();
const server = createServer(options, app);
const io = new Server(server);

app.get('/', (_req, res) => {
  res.send(
    '<h1>Fides Signal Server</h1><p>Status: Online</p><p>Active connections: ' +
      connections.length +
      '</p>',
  );
});

let connections = [];

io.on('connection', (socket) => {
  console.log('a user connected: ', socket.id);

  for (const [key] of io.sockets.sockets) {
    connections.push(key);
  }

  socket.on('share_id', ({ peerId }) => {
    socket.to(peerId).emit('get_id', { peerId: socket.id });
  });

  socket.on('send_candidate', ({ candidate, peerId }) => {
    socket.to(peerId).emit('get_candidate', { candidate, peerId: socket.id });
  });

  socket.on('send_connection_offer', ({ offer, peerId }) => {
    socket
      .to(peerId)
      .emit('get_connection_offer', { offer, peerId: socket.id });
  });

  socket.on('answer', ({ answer, peerId }) => {
    socket.to(peerId).emit('get_answer', { answer, peerId: socket.id });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    connections = connections.filter((connection) => connection !== socket.id);
    console.log('A user disconnected');
  });

  // for debugging purposes
  if (process.env.NODE_ENV === 'development') {
    socket.onAny((eventName, ...args) => {
      console.log(eventName);
      console.log(args);
    });

    socket.onAnyOutgoing((eventName, ...args) => {
      console.log(eventName);
      console.log(args);
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server running at https://localhost:${PORT}`);
});
