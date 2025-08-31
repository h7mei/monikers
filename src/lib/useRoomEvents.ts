'use client';

import { useEffect, useState } from 'react';
import { GameRoom } from './roomManager';
import { trpc } from '@/server/trpcClient';

export function useRoomEvents(roomId: string) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use tRPC to get room data with polling for real-time updates
  const { data: roomData, error: trpcError, isLoading } = trpc.room.getRoom.useQuery(
    { roomId },
    { 
      enabled: !!roomId,
      refetchInterval: 1000, // Poll every second for real-time updates
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: 1000
    }
  );

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
