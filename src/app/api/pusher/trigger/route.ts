import { NextRequest } from 'next/server';
import { pusherServer } from '@/pusher/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, event, data } = body as {
      channel: string;
      event: string;
      data: unknown;
    };

    if (!channel || !event) {
      return new Response('Invalid payload', { status: 400 });
    }

    await pusherServer.trigger(channel, event, data ?? {});
    return Response.json({ ok: true });
  } catch (err) {
    return new Response('Error triggering event', { status: 500 });
  }
}


