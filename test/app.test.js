import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { io as ioClient } from 'socket.io-client';
import fs from 'node:fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_PORT = 3001;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;

// Mock server setup for testing
let server;
let io;
let httpServer;

describe('Mandator Signal Server', () => {
  before(async () => {
    // Verify SSL certificates exist
    assert.ok(
      fs.existsSync(SSL_KEY_PATH),
      'SSL key file must exist for testing',
    );
    assert.ok(
      fs.existsSync(SSL_CERT_PATH),
      'SSL cert file must exist for testing',
    );

    // Import and configure server for testing
    const express = (await import('express')).default;
    const { createServer } = await import('node:https');
    const { Server } = await import('socket.io');

    const options = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
    };

    const app = express();
    httpServer = createServer(options, app);
    io = new Server(httpServer);

    const connections = [];

    app.get('/', (_req, res) => {
      res.send(
        '<h1>Mandator Signal Server</h1><p>Status: Online</p><p>Active connections: ' +
        connections.length +
        '</p>',
      );
    });

    io.on('connection', (socket) => {
      connections.push(socket.id);

      socket.on('share_id', ({ peerId }) => {
        socket.to(peerId).emit('get_id', { peerId: socket.id });
      });

      socket.on('send_candidate', ({ candidate, peerId }) => {
        socket
          .to(peerId)
          .emit('get_candidate', { candidate, peerId: socket.id });
      });

      socket.on('send_connection_offer', ({ offer, peerId }) => {
        socket
          .to(peerId)
          .emit('get_connection_offer', { offer, peerId: socket.id });
      });

      socket.on('answer', ({ answer, peerId }) => {
        socket.to(peerId).emit('get_answer', { answer, peerId: socket.id });
      });

      socket.on('disconnect', () => {
        const index = connections.indexOf(socket.id);
        if (index > -1) {
          connections.splice(index, 1);
        }
      });
    });

    // Start server and fail fast on bind errors (e.g., restricted test environments)
    await new Promise((resolve, reject) => {
      const onError = (error) => {
        httpServer.off('error', onError);
        reject(error);
      };

      httpServer.once('error', onError);
      httpServer.listen(TEST_PORT, () => {
        httpServer.off('error', onError);
        resolve();
      });
    });
  });

  after(async () => {
    // Clean up
    if (io) {
      io.close();
    }
    if (httpServer?.listening) {
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
    }
  });

  test('server should start with HTTPS', () => {
    assert.ok(httpServer.listening, 'Server should be listening');
  });

  test('client should connect to server', async () => {
    const client = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false, // For self-signed certs in testing
    });

    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    assert.ok(client.connected, 'Client should be connected');
    client.close();
  });

  test('share_id event should relay peer ID', async () => {
    const client1 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });
    const client2 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);

    // Client1 shares ID with client2
    const promise = new Promise((resolve) => {
      client2.on('get_id', ({ peerId }) => {
        assert.strictEqual(peerId, client1.id, 'Should receive client1 ID');
        resolve();
      });
    });

    client1.emit('share_id', { peerId: client2.id });
    await promise;

    client1.close();
    client2.close();
  });

  test('send_candidate event should relay ICE candidate', async () => {
    const client1 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });
    const client2 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);

    const mockCandidate = { candidate: 'test-candidate', sdpMid: '0' };

    const promise = new Promise((resolve) => {
      client2.on('get_candidate', ({ candidate, peerId }) => {
        assert.deepStrictEqual(
          candidate,
          mockCandidate,
          'Should receive the candidate',
        );
        assert.strictEqual(peerId, client1.id, 'Should receive client1 ID');
        resolve();
      });
    });

    client1.emit('send_candidate', {
      candidate: mockCandidate,
      peerId: client2.id,
    });
    await promise;

    client1.close();
    client2.close();
  });

  test('send_connection_offer event should relay WebRTC offer', async () => {
    const client1 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });
    const client2 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);

    const mockOffer = { type: 'offer', sdp: 'test-sdp' };

    const promise = new Promise((resolve) => {
      client2.on('get_connection_offer', ({ offer, peerId }) => {
        assert.deepStrictEqual(offer, mockOffer, 'Should receive the offer');
        assert.strictEqual(peerId, client1.id, 'Should receive client1 ID');
        resolve();
      });
    });

    client1.emit('send_connection_offer', { offer: mockOffer, peerId: client2.id });
    await promise;

    client1.close();
    client2.close();
  });

  test('answer event should relay WebRTC answer', async () => {
    const client1 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });
    const client2 = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);

    const mockAnswer = { type: 'answer', sdp: 'test-answer-sdp' };

    const promise = new Promise((resolve) => {
      client2.on('get_answer', ({ answer, peerId }) => {
        assert.deepStrictEqual(answer, mockAnswer, 'Should receive the answer');
        assert.strictEqual(peerId, client1.id, 'Should receive client1 ID');
        resolve();
      });
    });

    client1.emit('answer', { answer: mockAnswer, peerId: client2.id });
    await promise;

    client1.close();
    client2.close();
  });

  test('server should handle client disconnect', async () => {
    const client = ioClient(`https://localhost:${TEST_PORT}`, {
      rejectUnauthorized: false,
    });

    await new Promise((resolve) => client.on('connect', resolve));

    const disconnectPromise = new Promise((resolve) => {
      client.on('disconnect', resolve);
    });

    client.close();
    await disconnectPromise;

    assert.ok(!client.connected, 'Client should be disconnected');
  });

  test('multiple clients should be able to connect simultaneously', async () => {
    const clients = [];
    const numClients = 5;

    for (let i = 0; i < numClients; i++) {
      const client = ioClient(`https://localhost:${TEST_PORT}`, {
        rejectUnauthorized: false,
      });
      clients.push(client);
    }

    await Promise.all(
      clients.map((client) => new Promise((resolve) => client.on('connect', resolve))),
    );

    for (const client of clients) {
      assert.ok(client.connected, 'All clients should be connected');
    }

    // Clean up
    for (const client of clients) {
      client.close();
    }
  });
});
