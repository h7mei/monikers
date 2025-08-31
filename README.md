# Monikers - Multiplayer Card Game

A multiplayer version of the classic Monikers card guessing game built with Next.js, TypeScript, and tRPC.

## Features

### Single Player Mode

- Classic Monikers gameplay
- Multiple rounds with different guessing rules
- Score tracking and statistics

### Multiplayer Mode

- **QR Code Room System**: Host creates a room and generates a QR code for players to join
- **Real-time Updates**: Live synchronization between host and mobile players
- **Mobile-Optimized**: Players can join on their phones via QR code scanning
- **Room Management**: Create, join, and manage game rooms

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd monikers
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Play Multiplayer

### For Host (Desktop)

1. Click "Multiplayer" on the main menu
2. Click "Create Room"
3. Enter your name and game settings
4. Click "Create Room" to generate a room
5. Share the QR code with players
6. Wait for players to join
7. Click "Start Game" when ready

### For Players (Mobile)

1. Scan the QR code shared by the host
2. Enter your name
3. Click "Join Room"
4. Keep the mobile screen open during the game
5. Watch for your turn and game updates

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **API**: tRPC for type-safe server communication
- **Real-time**: Server-Sent Events (SSE)
- **QR Codes**: qrcode library
- **State Management**: React hooks with tRPC

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes (tRPC, SSE)
│   ├── join/[roomId]/     # Mobile join page
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── GameScreen.tsx    # Main game interface
│   ├── MultiplayerSetupScreen.tsx  # Multiplayer setup
│   ├── MobilePlayerView.tsx        # Mobile player interface
│   └── QRCodeDisplay.tsx # QR code generation
├── lib/                  # Utility libraries
│   ├── roomManager.ts    # Room management logic
│   ├── trpc.ts          # tRPC server setup
│   ├── trpcClient.ts   # tRPC client setup (moved to /server)
│   └── useRoomEvents.ts # SSE hook for real-time updates
└── data/                # Game data and cards
```

## API Endpoints

### tRPC Routes

- `room.createRoom` - Create a new game room
- `room.joinRoom` - Join an existing room
- `room.getRoom` - Get room information
- `room.updateGameState` - Update game state
- `room.leaveRoom` - Leave a room

### Server-Sent Events

- tRPC procedures for all room operations and real-time updates

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Adding New Features

1. The game uses tRPC for type-safe API calls
2. Real-time updates are handled via Server-Sent Events
3. Room management is centralized in `roomManager.ts`
4. Mobile interface is optimized for phone screens

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

© arfianadam

---

**Note**: This is a multiplayer implementation of the classic Monikers game. Players use their phones to join via QR codes while the host manages the game on desktop.
