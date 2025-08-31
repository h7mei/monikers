'use client';

import { useState, useEffect } from 'react';
import { roomManager, GameRoom, Player } from '@/lib/roomManager';

interface Props {
  roomId: string;
  player: Player;
  onGameStart: (room: GameRoom) => void;
}

export default function WaitingScreen({ roomId, player, onGameStart }: Props) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Load room data
  useEffect(() => {
    const roomData = roomManager.getRoom(roomId);
    if (roomData) {
      setRoom(roomData);
      setIsHost(roomData.hostId === player.id);
    }
  }, [roomId, player.id]);

  // Poll for room updates
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      const updatedRoom = roomManager.getRoom(roomId);
      if (updatedRoom) {
        setRoom(updatedRoom);
        
        // Check if game has started
        if (updatedRoom.gameState !== 'waiting') {
          onGameStart(updatedRoom);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room, roomId, onGameStart]);

  const handleStartGame = () => {
    if (!room) return;
    
    // Start with card selection phase
    roomManager.updateGameState(room.id, 'card-selection');
    roomManager.updateCurrentPlayer(room.id, 0); // Start with first player
    
    onGameStart(room);
  };

  const handleLeaveRoom = () => {
    if (room) {
      roomManager.leaveRoom(room.id, player.id);
      window.location.href = '/';
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  const getTeamCount = (team: 'team1' | 'team2') => {
    return room.players.filter(p => p.team === team).length;
  };

  const getTeamPlayers = (team: 'team1' | 'team2') => {
    return room.players.filter(p => p.team === team);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Waiting for Game</h1>
          <p className="text-gray-400">Room: {roomId.toUpperCase()}</p>
        </div>

        {/* Player Info */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">{player.name}</h2>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-400">{isHost ? 'Host' : 'Player'}</span>
              {player.team && (
                <span className={`px-2 py-1 rounded text-xs ${
                  player.team === 'team1' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {player.team === 'team1' ? 'Team 1' : 'Team 2'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Room Status */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">Players in room:</p>
          <p className="text-lg font-semibold">{room.players.length} / {room.settings.players}</p>
        </div>

        {/* Team Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-400">Team 1</h3>
            <p className="text-lg font-bold">{getTeamCount('team1')}</p>
          </div>
          <div className="bg-green-500/20 p-3 rounded-lg">
            <h3 className="text-sm font-semibold text-green-400">Team 2</h3>
            <p className="text-lg font-bold">{getTeamCount('team2')}</p>
          </div>
        </div>

        {/* Player Lists */}
        <div className="space-y-4">
          {/* Team 1 Players */}
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Team 1</h3>
            <div className="space-y-1">
              {getTeamPlayers('team1').map((p) => (
                <div key={p.id} className="text-sm text-gray-300 flex items-center justify-between">
                  <span>{p.name}</span>
                  <div className="flex items-center space-x-2">
                    {p.isHost && <span className="text-yellow-400 text-xs">(Host)</span>}
                    {p.id === player.id && <span className="text-blue-400 text-xs">(You)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 Players */}
          <div>
            <h3 className="text-sm font-semibold text-green-400 mb-2">Team 2</h3>
            <div className="space-y-1">
              {getTeamPlayers('team2').map((p) => (
                <div key={p.id} className="text-sm text-gray-300 flex items-center justify-between">
                  <span>{p.name}</span>
                  <div className="flex items-center space-x-2">
                    {p.isHost && <span className="text-yellow-400 text-xs">(Host)</span>}
                    {p.id === player.id && <span className="text-green-400 text-xs">(You)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isHost && (
            <button
              className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-green-500/20 disabled:opacity-50"
              onClick={handleStartGame}
              disabled={room.players.length < 2}
            >
              Start Game ({room.players.length} players)
            </button>
          )}
          
          {!isHost && (
            <div className="text-center text-gray-400 text-sm">
              Waiting for host to start the game...
            </div>
          )}

          <button
            className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full"
            onClick={handleLeaveRoom}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
