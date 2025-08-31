import { NextRequest } from 'next/server';
import { roomManager } from '@/lib/roomManager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  // Check if room exists
  const room = roomManager.getRoom(roomId);
  if (!room) {
    return new Response('Room not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial room state
      const initialData = JSON.stringify({
        type: 'room-state',
        data: room,
      });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Set up polling for room updates
      const interval = setInterval(() => {
        const updatedRoom = roomManager.getRoom(roomId);
        if (updatedRoom) {
          const data = JSON.stringify({
            type: 'room-update',
            data: updatedRoom,
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } else {
          // Room was deleted
          const data = JSON.stringify({
            type: 'room-deleted',
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          clearInterval(interval);
          controller.close();
        }
      }, 1000); // Poll every second

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
