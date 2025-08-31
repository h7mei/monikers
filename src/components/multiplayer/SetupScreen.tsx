'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import QRCodeDisplay from './QRCodeDisplay';
import { roomManager, GameRoom, Player } from '@/lib/roomManager';

interface Props {
  onRoomCreated: (room: GameRoom, player: Player) => void;
  onJoinRoom: (roomId: string, player: Player) => void;
}

export default function MultiplayerSetupScreen({ onRoomCreated, onJoinRoom }: Props) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [hostName, setHostName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState(4);
  const [cards, setCards] = useState(5);
  const [createdRoom, setCreatedRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState('');

  // Poll for room updates when a room is created
  useEffect(() => {
    if (!createdRoom) return;

    const interval = setInterval(() => {
      const updatedRoom = roomManager.getRoom(createdRoom.id);
      if (updatedRoom) {
        setCreatedRoom(updatedRoom);
      }
    }, 500); // Poll every 500ms for more responsive updates

    // Listen for storage changes (when other tabs update the room)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'monikers_rooms' && e.newValue) {
        const updatedRoom = roomManager.getRoom(createdRoom.id);
        if (updatedRoom) {
          setCreatedRoom(updatedRoom);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [createdRoom]);

  const handleCreateRoom = () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    const room = roomManager.createRoom(hostName);
    const player = room.players.find(p => p.id === room.hostId)!;

    // Update room settings
    roomManager.updateSettings(room.id, { players, cardsPerPlayer: cards });

    setCreatedRoom(room);
    onRoomCreated(room, player);
    setError('');
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomId.trim()) {
      setError('Please enter room code');
      return;
    }

    // Check if room exists
    const room = roomManager.getRoom(roomId.toLowerCase());
    if (!room) {
      setError('Room not found');
      return;
    }

    // Check if room is full
    if (room.players.length >= room.settings.players) {
      setError('Room is full');
      return;
    }

    // Check if name is already taken
    const nameExists = room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (nameExists) {
      setError('Name already taken');
      return;
    }

    // Redirect to team selection page with player name
    const teamSelectionUrl = `/join/${roomId.toLowerCase()}/team-selection?playerName=${encodeURIComponent(playerName)}`;
    window.location.href = teamSelectionUrl;
  };

  const handleStartGame = () => {
    if (createdRoom) {
      roomManager.updateGameState(createdRoom.id, 'card-selection');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-svh p-4">
      <h1 className="text-4xl font-bold mb-8">Monikers Multiplayer</h1>

      {mode === 'menu' && (
        <div className="w-80 space-y-4">
          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-blue-500/20"
            onClick={() => setMode('create')}
          >
            Create Room
          </button>
          <button
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-green-500/20"
            onClick={() => setMode('join')}
          >
            Join Room
          </button>
        </div>
      )}

      {mode === 'create' && !createdRoom && (
        <div className="w-80 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-50 mb-2">
              Your Name
            </label>
            <Input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-50 mb-2">
              Number of Players
            </label>
            <Input
              type="number"
              value={players}
              onChange={(e) => setPlayers(parseInt(e.target.value))}
              min={2}
              max={12}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-50 mb-2">
              Cards per Player
            </label>
            <Input
              type="number"
              value={cards}
              onChange={(e) => setCards(parseInt(e.target.value))}
              min={1}
              max={10}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex space-x-2">
            <button
              className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full"
              onClick={() => setMode('menu')}
            >
              Back
            </button>
            <button
              className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
              onClick={handleCreateRoom}
            >
              Create Room
            </button>
          </div>
        </div>
      )}

      {createdRoom && (
        <div className="w-96 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Room Created!</h2>
            <p className="text-gray-400">Share this QR code with players</p>
          </div>

          <QRCodeDisplay roomId={createdRoom.id} />

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">Players in room:</p>
            <p className="text-lg font-semibold">{createdRoom.players.length} / {createdRoom.settings.players}</p>

            {/* Team breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-400">Team 1</h3>
                <p className="text-lg font-bold">{createdRoom.players.filter(p => p.team === 'team1').length}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <h3 className="text-sm font-semibold text-green-400">Team 2</h3>
                <p className="text-lg font-bold">{createdRoom.players.filter(p => p.team === 'team2').length}</p>
              </div>
            </div>

            {/* Player list */}
            <div className="mt-4 space-y-1">
              {createdRoom.players.map((player) => (
                <div key={player.id} className="text-sm text-gray-300 flex items-center justify-center space-x-2">
                  <span>{player.name}</span>
                  {player.isHost && <span className="text-yellow-400">(Host)</span>}
                  <span className={`px-2 py-1 rounded text-xs ${player.team === 'team1'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-green-500/20 text-green-400'
                    }`}>
                    {player.team === 'team1' ? 'Team 1' : 'Team 2'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-green-500/20 disabled:opacity-50"
            onClick={handleStartGame}
            disabled={createdRoom.players.length < 2}
          >
            Start Game ({createdRoom.players.length} players)
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-80 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-50 mb-2">
              Your Name
            </label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-50 mb-2">
              Room Code
            </label>
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={8}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex space-x-2">
            <button
              className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full"
              onClick={() => setMode('menu')}
            >
              Back
            </button>
            <button
              className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
              onClick={handleJoinRoom}
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-8">© arfianadam</div>
    </div>
  );
}
