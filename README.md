# Monikers - Multiplayer Card Game

A multiplayer version of the classic Monikers card guessing game built with Next.js, TypeScript, and Pusher for real-time communication.

## Features

### Single Player Mode

- Classic Monikers gameplay
- Multiple rounds with different guessing rules
- Score tracking and statistics
- Card selection and game setup

### Multiplayer Mode

- **QR Code Room System**: Host creates a room and generates a QR code for players to join
- **Real-time Updates**: Live synchronization between host and mobile players using Pusher
- **Mobile-Optimized**: Players can join on their phones via QR code scanning
- **Room Management**: Create, join, and manage game rooms
- **Team-based Gameplay**: Support for team-based scoring and gameplay
- **Card Selection**: Players can select cards before the game begins
- **Timer System**: Individual player timers and round management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Pusher account and credentials

### Environment Variables

Create a `.env.local` file with your Pusher credentials:

```bash
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

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
7. Start card selection when ready
8. Click "Start Game" to begin gameplay

### For Players (Mobile)

1. Scan the QR code shared by the host
2. Enter your name
3. Click "Join Room"
4. Select your cards during the card selection phase
5. Keep the mobile screen open during the game
6. Watch for your turn and game updates

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Real-time**: Pusher for WebSocket communication
- **QR Codes**: qrcode library
- **State Management**: React hooks with custom room management
- **Database**: PostgreSQL with pg driver
- **Development**: Turbopack for faster builds

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   └── pusher/        # Pusher webhook endpoints
│   ├── join/[roomId]/     # Mobile join page
│   ├── multiplayer/       # Multiplayer game routes
│   ├── set/               # Game setup routes
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── single/           # Single player components
│   │   ├── SetupScreen.tsx
│   │   ├── CardSelectionScreen.tsx
│   │   ├── GameScreen.tsx
│   │   └── ScoreScreen.tsx
│   └── multiplayer/      # Multiplayer components
│       ├── SetupScreen.tsx
│       ├── CardSelectionScreen.tsx
│       ├── GameScreen.tsx
│       ├── PlayerView.tsx
│       ├── WaitingScreen.tsx
│       ├── QRCodeDisplay.tsx
│       └── RealtimeNav.tsx
├── hooks/                # Custom React hooks
│   └── useRoomChannel.ts # Pusher channel management
├── lib/                  # Utility libraries
│   ├── roomManager.ts    # Room management logic
│   ├── useRoomEvents.ts  # Legacy room events (deprecated)
│   └── utils.ts          # Utility functions
├── pusher/               # Pusher configuration
│   ├── client.ts         # Client-side Pusher setup
│   └── server.ts         # Server-side Pusher setup
└── data/                # Game data and cards
```

## Real-time Communication

### Pusher Channels

The game uses Pusher channels for real-time communication:

- **Room Channels**: Each room has its own channel (`room-{roomId}`)
- **Events**: 
  - `room:updated` - Room state changes
  - `room:deleted` - Room deletion
  - `room:state` - Room state updates

### Room Management

- **Local Storage**: Rooms are persisted in browser localStorage
- **Real-time Sync**: All room updates are broadcast to connected players
- **Auto-reconnection**: Automatic reconnection handling for network issues

## API Endpoints

### Pusher Webhooks

- `/api/pusher/trigger` - Trigger Pusher events for room updates

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run check` - Run lint and format checks

### Adding New Features

1. The game uses Pusher for real-time communication
2. Room management is centralized in `roomManager.ts`
3. Components are organized by game mode (single/multiplayer)
4. Mobile interface is optimized for phone screens
5. Use the `useRoomChannel` hook for real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

© arfianadam

---

**Note**: This is a multiplayer implementation of the classic Monikers game. Players use their phones to join via QR codes while the host manages the game on desktop. The game now uses Pusher for reliable real-time communication instead of Server-Sent Events.
