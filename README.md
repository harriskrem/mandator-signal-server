# Mandator Signal Server

A lightweight WebRTC signaling server for the Mandator peer-to-peer application. This server facilitates the exchange of connection information between peers to establish direct WebRTC connections.

## Features

- **WebSocket-based signaling** using Socket.IO for real-time communication
- **SSL/TLS support** for secure connections
- **Connection tracking** to monitor active peer connections
- **WebRTC signaling events** for ICE candidate exchange, offer/answer negotiation
- **Development mode logging** for debugging WebSocket events

## Prerequisites

- Node.js 18+ (for built-in test runner support)
- SSL certificate and key files

## Installation

```bash
# Install dependencies
yarn install
```

## Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
# Server Configuration
PORT=3000

# SSL Certificate Paths
SSL_KEY_PATH=/path/to/your/server.key
SSL_CERT_PATH=/path/to/your/server.crt

# Environment (optional, for debugging)
NODE_ENV=development
```

### Generating SSL Certificates

For development, you can generate self-signed SSL certificates:

```bash
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes
```

For production, use certificates from a trusted Certificate Authority (CA) like Let's Encrypt.

## Usage

### Development Mode

Run the server with auto-reload on file changes:

```bash
yarn dev
```

### Production Mode

Start the server:

```bash
yarn start
```

The server will be available at `https://localhost:3000` (or your configured port).

## Available Scripts

- `yarn start` - Start the server in production mode
- `yarn dev` - Start the server with nodemon for development
- `yarn test` - Run the test suite
- `yarn test:watch` - Run tests in watch mode
- `yarn lint` - Check code quality with Biome
- `yarn format` - Format code with Biome
- `yarn check` - Check and auto-fix issues with Biome

## WebSocket Events API

The server uses Socket.IO for WebSocket communication. Here are the supported events:

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `share_id` | `{ peerId: string }` | Share your peer ID with another peer |
| `send_candidate` | `{ candidate: RTCIceCandidate, peerId: string }` | Send ICE candidate to a peer |
| `send_connection_offer` | `{ offer: RTCSessionDescription, peerId: string }` | Send WebRTC offer to a peer |
| `answer` | `{ answer: RTCSessionDescription, peerId: string }` | Send WebRTC answer to a peer |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `get_id` | `{ peerId: string }` | Receive peer ID from another peer |
| `get_candidate` | `{ candidate: RTCIceCandidate, peerId: string }` | Receive ICE candidate from a peer |
| `get_connection_offer` | `{ offer: RTCSessionDescription, peerId: string }` | Receive WebRTC offer from a peer |
| `get_answer` | `{ answer: RTCSessionDescription, peerId: string }` | Receive WebRTC answer from a peer |

### Connection Events

- `connection` - Emitted when a new client connects (server-side)
- `disconnect` - Emitted when a client disconnects (server-side)

## Testing

Run the test suite:

```bash
yarn test
```

Run tests in watch mode during development:

```bash
yarn test:watch
```

Tests use Node.js's built-in test runner (no external dependencies required) and verify:
- Server initialization and HTTPS configuration
- Socket.IO connection handling
- WebRTC signaling event routing
- Connection tracking
- Disconnect handling

## HTTP Endpoints

- `GET /` - Server status page showing:
  - Server status (Online/Offline)
  - Number of active connections

## Architecture

The server is built with:
- **Express.js** - HTTP server framework
- **Socket.IO** - WebSocket communication
- **Node.js HTTPS** - Secure server with SSL/TLS
- **dotenv** - Environment variable management

## Development

When running in development mode (`NODE_ENV=development`), the server logs all incoming and outgoing Socket.IO events for debugging purposes.

## License

MIT

## Author

Charalampos Kremmydas
