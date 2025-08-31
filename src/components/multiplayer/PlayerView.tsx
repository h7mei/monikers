'use client';

import { useState, useEffect } from 'react';
import { roomManager, Player } from '@/lib/roomManager';
import { Card } from '@/components/single/GameScreen';

interface Props {
  roomId: string;
  player: Player;
  gameState: 'waiting' | 'card-selection' | 'playing' | 'finished';
  currentRound: number;
  scores: Record<string, Record<number, Card[]>>;
  currentTeam: string;
  currentPlayerId: string | null;
  timer: number;
  isRoundActive: boolean;
}

export default function PlayerView({
  roomId,
  player,
  gameState,
  currentRound,
  scores,
  currentTeam,
  currentPlayerId,
  timer,
  isRoundActive
}: Props) {
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    const loadRoom = () => {
      const roomData = roomManager.getRoom(roomId);
      if (roomData) {
        setRoom(roomData);
      }
    };

    loadRoom();
    const interval = setInterval(loadRoom, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  const isMyTurn = currentPlayerId === player.id;
  const roundDescription = `Round ${currentRound}: ${currentRound === 1 ? 'Free Talking' : currentRound === 2 ? 'One Word' : 'Expressions'
    }`;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTeamScore = (team: string, round: number) => {
    return scores[team]?.[round]?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Player Info */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{player.name}</h1>
          <div className="flex items-center justify-center space-x-2">
            <p className="text-gray-400">{player.isHost ? 'Host' : 'Player'}</p>
            {player.team && (
              <span className={`px-2 py-1 rounded text-xs ${player.team === 'team1'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-green-500/20 text-green-400'
                }`}>
                {player.team === 'team1' ? 'Team 1' : 'Team 2'}
              </span>
            )}
          </div>
        </div>

        {/* Game State */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Game Status</h2>
            <p className="text-gray-400">{roundDescription}</p>
            <p className="text-sm text-gray-500 mt-1">
              State: {gameState.charAt(0).toUpperCase() + gameState.slice(1)}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className={`text-4xl font-mono font-bold ${timer <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-500'
            }`}>
            {formatTime(timer)}
          </div>
          <p className="text-gray-400 mt-2">
            {isMyTurn ? 'Your turn!' : 'Waiting for other players...'}
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500/20 p-4 rounded-lg">
            <h3 className="text-center text-blue-400 font-semibold mb-2">Team 1</h3>
            <div className="space-y-1">
              <div className="text-center">
                <span className="text-2xl font-bold">{getTeamScore('team1', currentRound)}</span>
                <p className="text-xs text-gray-400">Round {currentRound}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-500/20 p-4 rounded-lg">
            <h3 className="text-center text-green-400 font-semibold mb-2">Team 2</h3>
            <div className="space-y-1">
              <div className="text-center">
                <span className="text-2xl font-bold">{getTeamScore('team2', currentRound)}</span>
                <p className="text-xs text-gray-400">Round {currentRound}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Team */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-center font-semibold mb-2">Current Team</h3>
          <p className="text-center text-gray-400">
            {currentTeam === 'team1' ? 'Team 1' : 'Team 2'} is playing
          </p>
        </div>

        {/* Room Info */}
        {room && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-center font-semibold mb-2">Room Info</h3>
            <p className="text-center text-gray-400">
              Room: {roomId.toUpperCase()}
            </p>
            <p className="text-center text-gray-400">
              Players: {room.players.length} / {room.settings.players}
            </p>
          </div>
        )}

        {/* End Game Button (Host Only) */}
        {player.isHost && (
          <button
            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
            onClick={() => {
              roomManager.updateGameState(roomId, 'finished');
              roomManager.deleteRoom(roomId);
              window.location.href = '/';
            }}
          >
            End Game
          </button>
        )}
      </div>
    </div>
  );
}
