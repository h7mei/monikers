import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { roomManager } from './roomManager';

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Room management procedures
export const roomRouter = router({
  createRoom: publicProcedure
    .input(
      z.object({
        hostName: z.string().min(1),
        players: z.number().min(2).max(12),
        cardsPerPlayer: z.number().min(1).max(10),
      })
    )
    .mutation(({ input }) => {
      const room = roomManager.createRoom(input.hostName);
      roomManager.updateSettings(room.id, {
        players: input.players,
        cardsPerPlayer: input.cardsPerPlayer,
      });

      const player = room.players.find((p) => p.id === room.hostId)!;

      return {
        room,
        player,
        success: true,
      };
    }),

  joinRoom: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerName: z.string().min(1),
        deviceType: z.enum(['desktop', 'mobile']),
      })
    )
    .mutation(({ input }) => {
      const player = roomManager.joinRoom(
        input.roomId,
        input.playerName,
        input.deviceType
      );

      if (!player) {
        throw new Error('Invalid room code or room is full');
      }

      const room = roomManager.getRoom(input.roomId);

      return {
        player,
        room,
        success: true,
      };
    }),

  getRoom: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      })
    )
    .query(({ input }) => {
      const room = roomManager.getRoom(input.roomId);

      if (!room) {
        throw new Error('Room not found');
      }

      return room;
    }),

  updateGameState: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        gameState: z.enum(['waiting', 'card-selection', 'playing', 'finished']),
      })
    )
    .mutation(({ input }) => {
      const success = roomManager.updateGameState(
        input.roomId,
        input.gameState
      );

      if (!success) {
        throw new Error('Failed to update game state');
      }

      const room = roomManager.getRoom(input.roomId);
      return { room, success: true };
    }),

  leaveRoom: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const success = roomManager.leaveRoom(input.roomId, input.playerId);

      if (!success) {
        throw new Error('Failed to leave room');
      }

      const room = roomManager.getRoom(input.roomId);
      return { room, success: true };
    }),
});

export const appRouter = router({
  room: roomRouter,
});

export type AppRouter = typeof appRouter;
