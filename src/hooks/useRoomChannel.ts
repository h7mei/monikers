import { useEffect, useRef } from 'react';
import { getPusherClient } from '@/pusher/client';
import { roomManager, GameRoom } from '@/lib/roomManager';

type Handler = () => void;

export function useRoomChannel(
  roomId: string | undefined,
  onUpdate?: Handler,
  onDeleted?: Handler,
  onState?: Handler
) {
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) return;

    const connectToChannel = () => {
      try {
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`room-${roomId}`);
        channelRef.current = channel;

        const applyDataAnd = (cb?: Handler) => (data?: { roomId?: string; room?: GameRoom }) => {
          if (data?.room) {
            roomManager.applySnapshot(data.room);
          }
          cb && cb();
        };

        const handleUpdate = applyDataAnd(onUpdate);
        const handleDeleted = applyDataAnd(onDeleted);
        const handleState = applyDataAnd(onState);

        // Handle connection events
        channel.bind('pusher:subscription_succeeded', () => {
          console.log(`Connected to room ${roomId}`);
        });

        channel.bind('pusher:subscription_error', (error: any) => {
          console.error(`Subscription error for room ${roomId}:`, error);
          scheduleReconnect();
        });

        channel.bind('room:updated', handleUpdate as any);
        channel.bind('room:deleted', handleDeleted as any);
        channel.bind('room:state', handleState as any);

        // Handle Pusher connection state
        pusher.connection.bind('connected', () => {
          console.log('Pusher connected');
        });

        pusher.connection.bind('disconnected', () => {
          console.log('Pusher disconnected, attempting to reconnect...');
          scheduleReconnect();
        });

        pusher.connection.bind('error', (error: any) => {
          console.error('Pusher connection error:', error);
          scheduleReconnect();
        });

      } catch (error) {
        console.error('Error connecting to channel:', error);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect to room ${roomId}...`);
        if (channelRef.current) {
          try {
            const pusher = getPusherClient();
            pusher.unsubscribe(`room-${roomId}`);
          } catch (error) {
            console.error('Error unsubscribing:', error);
          }
        }
        connectToChannel();
      }, 2000); // Wait 2 seconds before reconnecting
    };

    // Initial connection
    connectToChannel();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (channelRef.current) {
        try {
          const pusher = getPusherClient();
          pusher.unsubscribe(`room-${roomId}`);
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      }
    };
  }, [roomId, onUpdate, onDeleted, onState]);
}


