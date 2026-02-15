import fs from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;
const useHttps = Boolean(sslKeyPath && sslCertPath);
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

const server = useHttps
  ? createHttpsServer(
      {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      },
      app,
    )
  : createHttpServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.get('/', (_req, res) => {
  res.send(
    '<h1>Mandator Signal Server</h1><p>Status: Online</p><p>Active connections: ' +
      connections.size +
      '</p>',
  );
});

const connections = new Set();

io.on('connection', (socket) => {
  console.log('a user connected: ', socket.id);
  connections.add(socket.id);

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
    connections.delete(socket.id);
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
  const protocol = useHttps ? 'https' : 'http';
  console.log(`server running at ${protocol}://localhost:${PORT}`);
});
