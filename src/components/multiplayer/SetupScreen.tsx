'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import QRCodeDisplay from './QRCodeDisplay';
import { roomManager, GameRoom, Player } from '@/lib/roomManager';
import { useRoomChannel } from '@/hooks/useRoomChannel';

interface Props {
  onRoomCreated: (room: GameRoom, player: Player) => void;
  onJoinRoom: (roomId: string, player: Player) => void;
}

export default function MultiplayerSetupScreen({ onRoomCreated }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [hostName, setHostName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState(4);
  const [cards, setCards] = useState(5);
  const [createdRoom, setCreatedRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Subscribe for updates when a room is created
  useEffect(() => {
    if (!createdRoom) return;
    const updatedRoom = roomManager.getRoom(createdRoom.id);
    if (updatedRoom) setCreatedRoom(updatedRoom);
  }, [createdRoom?.id]);

  const handleRealtimeUpdate = useCallback(() => {
    if (!createdRoom) return;
    const updatedRoom = roomManager.getRoom(createdRoom.id);
    if (updatedRoom) setCreatedRoom(updatedRoom);
  }, [createdRoom?.id]);

  useRoomChannel(createdRoom?.id || undefined, handleRealtimeUpdate, () => {
    setCreatedRoom(null);
  }, handleRealtimeUpdate);

  const handleCreateRoom = () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (isCreating || createdRoom) return;
    setIsCreating(true);

    const room = roomManager.createRoom(hostName);
    const player = room.players.find((p) => p.id === room.hostId)!;

    // Update room settings
    roomManager.updateSettings(room.id, { players, cardsPerPlayer: cards });

    setCreatedRoom(room);
    onRoomCreated(room, player);
    // Redirect host to game master view
    router.push(`/join/${room.id}/game-master`);
    setError('');
    setIsCreating(false);
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
    const nameExists = room.players.some(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (nameExists) {
      setError('Name already taken');
      return;
    }

    // Redirect to team selection page with player name
    const teamSelectionUrl = `/join/${roomId.toLowerCase()}/team-selection?playerName=${encodeURIComponent(playerName)}`;
    window.location.href = teamSelectionUrl;
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
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
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
