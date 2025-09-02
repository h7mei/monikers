'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPusherClient } from '@/pusher/client';

type ConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected';

export default function RealtimeNav({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConnectionState>('initialized');
  const [lastEventTs, setLastEventTs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomSubscribed, setRoomSubscribed] = useState<boolean>(false);
  const [lastRoomEventTs, setLastRoomEventTs] = useState<number | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const connection = pusher.connection;

    const onStateChange = (states: { previous: ConnectionState; current: ConnectionState }) => {
      setState(states.current);
      setLastEventTs(Date.now());
    };

    const onError = (err: any) => {
      setErrorMsg(err?.error?.message || 'Connection error');
      setLastEventTs(Date.now());
    };

    connection.bind('state_change', onStateChange as any);
    connection.bind('error', onError);

    // kick off connect if not already
    if (state === 'initialized') {
      try {
        pusher.connect();
      } catch { }
    }

    return () => {
      connection.unbind('state_change', onStateChange as any);
      connection.unbind('error', onError);
    };
  }, [state]);

  // Derive current roomId from URL like /join/<roomId>/... and react to route changes
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const match = pathname.match(/^\/join\/([^\/]+)/) || pathname.match(/^\/set\/?/);
    if (match && match[1]) setRoomId(match[1]);
    else setRoomId(null);
  }, [pathname]);

  // Subscribe to current room channel to reflect room-level connectivity and events
  useEffect(() => {
    if (!roomId) {
      setRoomSubscribed(false);
      setLastRoomEventTs(null);
      return;
    }
    const pusher = getPusherClient();
    const channelName = `room-${roomId}`;
    const channel = pusher.subscribe(channelName);

    const onSub = () => {
      setRoomSubscribed(true);
      setLastRoomEventTs(Date.now());
    };
    const onAnyEvent = () => setLastRoomEventTs(Date.now());

    channel.bind('pusher:subscription_succeeded', onSub as any);
    channel.bind('room:updated', onAnyEvent);
    channel.bind('room:deleted', onAnyEvent);
    channel.bind('room:state', onAnyEvent);

    return () => {
      channel.unbind('pusher:subscription_succeeded', onSub as any);
      channel.unbind('room:updated', onAnyEvent);
      channel.unbind('room:deleted', onAnyEvent);
      channel.unbind('room:state', onAnyEvent);
      pusher.unsubscribe(channelName);
    };
  }, [roomId]);

  const colorByState: Record<ConnectionState, string> = {
    initialized: 'bg-gray-600',
    connecting: 'bg-yellow-600',
    connected: 'bg-green-600',
    unavailable: 'bg-orange-600',
    failed: 'bg-red-700',
    disconnected: 'bg-red-600',
  };

  const statusText = state.charAt(0).toUpperCase() + state.slice(1);

  if (!roomId) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="w-full sticky top-0 left-0 z-50">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900/80 backdrop-blur border-b border-gray-800">
            <div className="text-sm text-gray-200 font-medium">
              Realtime
              <span className="ml-2 text-gray-400">
                Room <span className="font-semibold text-gray-200">{roomId.toUpperCase()}</span>
                {roomSubscribed ? (
                  <span className="ml-2 text-green-500">●</span>
                ) : (
                  <span className="ml-2 text-gray-500">○</span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`text-xs text-white px-2 py-1 rounded ${colorByState[state]}`}>{statusText}</div>
              {lastEventTs && (
                <div className="text-xs text-gray-400">updated {new Date(lastEventTs).toLocaleTimeString()}</div>
              )}
              {lastRoomEventTs && (
                <div className="text-xs text-gray-400">room {new Date(lastRoomEventTs).toLocaleTimeString()}</div>
              )}
              {errorMsg && <div className="text-xs text-red-400 truncate max-w-[200px]" title={errorMsg}>{errorMsg}</div>}
            </div>
          </div>
        </div>
      </div>
      <div>{children}</div>
    </>
  );
}


