'use client';

import { useEffect, useState } from 'react';
import { GameRoom } from './roomManager';

export function useRoomEvents(roomId: string) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const eventSource = new EventSource(`/api/room/${roomId}/events`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        switch (type) {
          case 'room-state':
          case 'room-update':
            setRoom(data);
            break;
          case 'room-deleted':
            setRoom(null);
            setError('Room was deleted');
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      setError('Connection lost');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [roomId]);

  return { room, isConnected, error };
}
