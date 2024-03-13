import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import fs from 'fs';

// const options = {
//   key: fs.readFileSync('/home/harriskr/certs/practice/server.key'), // replace it with your key path
//   cert: fs.readFileSync('/home/harriskr/certs/practice/server.crt'), // replace it with your certificate path
// };

const app = express();
const server = createServer(app);
const io = new Server(server);


app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected: ', socket.id);

  socket.on('signal', (data) => {
    const { id, message } = data;

    const connections: string[] = [];
    for (let [key] of io.sockets.sockets) {
      connections.push(key);
    }

    if (id && connections.includes(id)) {
      console.log("connections: ", connections);
      socket.broadcast.to(id).emit("data", message);
    } else {
      console.log("Wrong ID. Here are the connections: ", connections);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
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
  console.log('server running at http://localhost:3000');
});
