'use client';

import { useEffect, useState } from 'react';
import MultiplayerSetupScreen from '@/components/multiplayer/SetupScreen';
import { GameRoom, Player, roomManager } from '@/lib/roomManager';

export default function MultiplayerPage() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const handleRoomCreated = (newRoom: GameRoom, player: Player) => {
    setRoom(newRoom);
    setCurrentPlayer(player);
  };

  const handleJoinRoom = () => {
    // Join from this route is handled inside the component via redirect
  };

  useEffect(() => {
    if (!room || !currentPlayer) return;
    const updatedRoom = roomManager.getRoom(room.id);
    if (updatedRoom && updatedRoom.gameState !== 'waiting') {
      const gameUrl = `/join/${room.id}/waiting?playerId=${currentPlayer.id}`;
      window.location.href = gameUrl;
    }
  }, [room?.gameState, currentPlayer?.id]);

  return (
    <main className="bg-gray-900">
      <MultiplayerSetupScreen
        onRoomCreated={handleRoomCreated}
        onJoinRoom={handleJoinRoom}
      />
      <div className="fixed top-4 left-4">
        <a
          href="/"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Back to Menu
        </a>
      </div>
    </main>
  );
}


