import Pusher from 'pusher-js';

export function getPusherClient(): Pusher {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY as string;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string;

  if (process.env.NODE_ENV !== 'production') {
    (Pusher as any).logToConsole = true;
    if (!key) {
      console.error('Pusher: NEXT_PUBLIC_PUSHER_KEY is missing');
    }
    if (!cluster) {
      console.error('Pusher: NEXT_PUBLIC_PUSHER_CLUSTER is missing');
    }
    console.debug('Pusher: initializing client', { cluster, hasKey: Boolean(key) });
  }

  const client = new Pusher(key, {
    cluster,
    forceTLS: true,
    disableStats: true,
  });
  return client;
}

export type RoomEventMap = {
  'room:updated': { roomId: string };
  'room:deleted': { roomId: string };
  'room:state': { roomId: string };
};


