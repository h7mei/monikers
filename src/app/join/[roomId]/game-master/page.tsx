'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import QRCodeDisplay from '@/components/multiplayer/QRCodeDisplay';
import { roomManager, GameRoom } from '@/lib/roomManager';
import { useRoomChannel } from '@/hooks/useRoomChannel';

export default function GameMasterPage() {
  const params = useParams();
  const roomId = (params?.roomId as string)?.toLowerCase();
  const [room, setRoom] = useState<GameRoom | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const existing = roomManager.getRoom(roomId);
    if (existing) {
      setRoom(existing);
    }
  }, [roomId]);

  const handleRealtimeUpdate = useCallback(() => {
    if (!roomId) return;
    const updated = roomManager.getRoom(roomId);
    if (updated) setRoom(updated);
  }, [roomId]);

  useRoomChannel(roomId, handleRealtimeUpdate, () => { }, handleRealtimeUpdate);

  const handleStartGame = () => {
    if (room) {
      roomManager.updateGameState(room.id, 'card-selection');
      // Redirect host to join the game as a player
      const hostId = room.hostId;
      if (hostId) {
        window.location.href = `/join/${room.id}/waiting?playerId=${encodeURIComponent(hostId)}`;
      }
    }
  };

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-svh p-4">
        <p className="text-gray-400">Room not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-96 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Room Created!</h2>
          <p className="text-gray-400">Share this QR code with players</p>
        </div>

        <QRCodeDisplay roomId={room.id} />

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">Players in room:</p>
          <p className="text-lg font-semibold">
            {room.players.length} / {room.settings.players}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-400">Team 1</h3>
              <p className="text-lg font-bold">
                {room.players.filter((p) => p.team === 'team1').length}
              </p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-green-400">Team 2</h3>
              <p className="text-lg font-bold">
                {room.players.filter((p) => p.team === 'team2').length}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            {room.players.map((player) => (
              <div
                key={player.id}
                className="text-sm text-gray-300 flex items-center justify-center space-x-2"
              >
                <span>{player.name}</span>
                {player.isHost && (
                  <span className="text-yellow-400">(Host)</span>
                )}
                <span
                  className={`px-2 py-1 rounded text-xs ${player.team === 'team1'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-green-500/20 text-green-400'
                    }`}
                >
                  {player.team === 'team1' ? 'Team 1' : 'Team 2'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-green-500/20 disabled:opacity-50"
          onClick={handleStartGame}
          disabled={room.players.length < 2}
        >
          Start Game ({room.players.length} players)
        </button>
      </div>

      <div className="fixed bottom-8">© arfianadam</div>
    </div>
  );
}


