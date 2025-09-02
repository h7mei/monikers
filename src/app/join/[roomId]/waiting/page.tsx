'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { roomManager, GameRoom, Player } from '@/lib/roomManager';
import WaitingScreen from '@/components/multiplayer/WaitingScreen';
import MultiplayerCardSelectionScreen from '@/components/multiplayer/CardSelectionScreen';
import MultiplayerGameScreen from '@/components/multiplayer/GameScreen';
import { useRoomChannel } from '@/hooks/useRoomChannel';

interface Props {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ playerId?: string }>;
}

export default function WaitingPage({ params, searchParams }: Props) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<
    'waiting' | 'card-selection' | 'playing' | 'finished'
  >('waiting');

  // Load player data
  useEffect(() => {
    if (!resolvedSearchParams.playerId) {
      window.location.href = '/';
      return;
    }
    const room = roomManager.getRoom(resolvedParams.roomId);
    if (!room) {
      window.location.href = '/';
      return;
    }
    const foundPlayer = room.players.find(
      (p) => p.id === resolvedSearchParams.playerId
    );
    if (!foundPlayer) {
      window.location.href = '/';
      return;
    }
    setPlayer(foundPlayer);

    // Check if game has already started
    if (room.gameState !== 'waiting') {
      setGameStarted(true);
      setGameState(room.gameState);
    }
  }, [resolvedParams.roomId, resolvedSearchParams.playerId]);

  const handleRealtimeUpdate = useCallback(() => {
    const room = roomManager.getRoom(resolvedParams.roomId);
    if (!room) return;
    setGameState(room.gameState);
    if (room.gameState !== 'waiting') setGameStarted(true);
  }, [resolvedParams.roomId]);

  useRoomChannel(resolvedParams.roomId, handleRealtimeUpdate, () => {
    window.location.href = '/';
  }, handleRealtimeUpdate);

  const handleGameStart = (room: GameRoom) => {
    setGameStarted(true);
    setGameState(room.gameState);
  };

  const handleCardSelectionComplete = () => {
    // The game will automatically transition to 'playing' state
    // when all players have selected their cards
  };

  const handleGameEnd = () => {
    window.location.href = '/';
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  // Show card selection screen
  if (gameStarted && gameState === 'card-selection') {
    return (
      <MultiplayerCardSelectionScreen
        roomId={resolvedParams.roomId}
        player={player}
        onSelectionComplete={handleCardSelectionComplete}
      />
    );
  }

  // Show game screen
  if (gameStarted && gameState === 'playing') {
    return (
      <MultiplayerGameScreen
        roomId={resolvedParams.roomId}
        player={player}
        onGameEnd={handleGameEnd}
      />
    );
  }

  // Show waiting screen
  return (
    <WaitingScreen
      roomId={resolvedParams.roomId}
      player={player}
      onGameStart={handleGameStart}
    />
  );
}
