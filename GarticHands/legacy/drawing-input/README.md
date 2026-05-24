# Gartic Hands

Multiplayer drawing game with hand tracking using MediaPipe.

## Project Structure

```
gartic-hands/
├── client/          # React frontend with MediaPipe hand tracking
├── server/          # Express.js backend with Socket.IO
├── package.json     # Root package.json with concurrent scripts
└── README.md
```

## Setup

1. Install all dependencies:
```bash
npm run install-all
```

2. Start development servers:
```bash
npm run dev
```

This will start:
- Client: http://localhost:5137
- Server: http://localhost:3000

## Individual Commands

- Start client only: `npm run client:dev`
- Start server only: `npm run server:dev`

## Features

- Real-time hand tracking using MediaPipe
- Multiplayer drawing with Socket.IO
- Clean client/server separation
