'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { roomManager, Player } from '@/lib/roomManager';
import { Card } from '@/components/single/GameScreen';
import PlayerView from '@/components/multiplayer/PlayerView';

interface Props {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function JoinRoomPage({ params }: Props) {
  const { roomId } = await params;
  const [playerName, setPlayerName] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Mock game state for demo (in real implementation, this would come from WebSocket)
  const [gameState] = useState<
    'waiting' | 'card-selection' | 'playing' | 'finished'
  >('waiting');
  const [currentRound] = useState(1);
  const [scores] = useState<Record<string, Record<number, Card[]>>>({
    team1: {},
    team2: {},
  });
  const [currentTeam] = useState('team1');
  const [currentPlayerId] = useState<string | null>(null);
  const [timer] = useState(60);
  const [isRoundActive] = useState(false);

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const newPlayer = roomManager.joinRoom(
        roomId,
        playerName,
        'mobile'
      );
      if (newPlayer) {
        setPlayer(newPlayer);
        setIsJoining(false);
        setError('');
      } else {
        setError('Invalid room code or room is full');
        setIsJoining(false);
      }
    }, 1000);
  };

  if (player) {
    return (
      <PlayerView
        roomId={roomId}
        player={player}
        gameState={gameState}
        currentRound={currentRound}
        scores={scores}
        currentTeam={currentTeam}
        currentPlayerId={currentPlayerId}
        timer={timer}
        isRoundActive={isRoundActive}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Join Room</h1>
          <p className="text-gray-400">Enter your name to join the game</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-50 mb-2">
            Your Name
          </label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full"
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleJoinRoom}
          disabled={isJoining}
        >
          {isJoining ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Joining...
            </div>
          ) : (
            'Join Room'
          )}
        </button>

        <div className="text-center text-sm text-gray-500">
          <p>Room Code: {roomId.toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
