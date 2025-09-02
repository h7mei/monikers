'use client';

import { useEffect, useState } from 'react';
import { GameRoom, roomManager } from './roomManager';

export function useRoomEvents(roomId: string) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deprecated tRPC hook removed; keep a minimal local lookup for compatibility
  const roomData = roomManager.getRoom(roomId);
  const trpcError = null as any;
  const isLoading = false;

  useEffect(() => {
    if (!roomId) return;

    // Set room data from tRPC
    if (roomData) {
      setRoom(roomData);
      setIsConnected(true);
      setError(null);
    }
  }, [roomId, roomData]);

  // Handle tRPC errors
  useEffect(() => {
    if (trpcError) {
      setError(trpcError.message);
      setIsConnected(false);
    }
  }, [trpcError]);

  // Handle loading state
  useEffect(() => {
    if (isLoading && roomId) {
      setIsConnected(false);
    }
  }, [isLoading, roomId]);

  return { room, isConnected, error };
}
