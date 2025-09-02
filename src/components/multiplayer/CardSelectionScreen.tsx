'use client';

import { useState, useEffect, useCallback } from 'react';
import { roomManager, GameRoom, Player } from '@/lib/roomManager';
import { useRoomChannel } from '@/hooks/useRoomChannel';
import cards1 from '@/data/cards-level1.json';
import cards2 from '@/data/cards-level2.json';
import cards3 from '@/data/cards-level3.json';
import cards4 from '@/data/cards-level4.json';
import { Card } from '@/components/single/GameScreen';

interface Props {
  roomId: string;
  player: Player;
  onSelectionComplete: (selectedCards: Card[]) => void;
}

const allCards: Card[] = [...cards1, ...cards2, ...cards3, ...cards4];

export default function MultiplayerCardSelectionScreen({
  roomId,
  player,
  onSelectionComplete,
}: Props) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);

  // Load room data once and subscribe for realtime updates
  useEffect(() => {
    const roomData = roomManager.getRoom(roomId);
    if (roomData) setRoom(roomData);
  }, [roomId]);

  const handleRealtimeUpdate = useCallback(() => {
    const updatedRoom = roomManager.getRoom(roomId);
    if (updatedRoom) setRoom(updatedRoom);
  }, [roomId]);

  useRoomChannel(roomId, handleRealtimeUpdate, () => {
    window.location.href = '/';
  }, handleRealtimeUpdate);

  // Generate available cards for this player
  useEffect(() => {
    if (!room) return;

    // Get all cards that have already been selected by other players
    const takenCards = new Set<string>();
    room.players.forEach((p) => {
      if (p.selectedCards) {
        p.selectedCards.forEach((card) => {
          // Handle both formats (roomManager format and GameScreen format)
          const cardId = card.id || (card as unknown as { word: string }).word;
          takenCards.add(cardId);
        });
      }
    });

    // Filter out cards that have already been selected
    const availableCards = allCards.filter(
      (card) => !takenCards.has(card.word)
    );

    // Available cards calculation complete

    // Ensure fair distribution across all levels

    // Create a better deterministic shuffle that ensures level diversity
    const deterministicShuffleWithLevelBalance = (
      cards: Card[],
      seed: string,
      targetCount: number
    ) => {
      // Separate cards by level
      const cardsByLevel = {
        1: cards.filter((card) => card.level === 1),
        2: cards.filter((card) => card.level === 2),
        3: cards.filter((card) => card.level === 3),
        4: cards.filter((card) => card.level === 4),
      };

      // Create seed for randomization
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }

      const seededRandom = (min: number, max: number) => {
        hash = (hash * 9301 + 49297) % 233280;
        const rnd = hash / 233280;
        return Math.floor(rnd * (max - min + 1)) + min;
      };

      // Shuffle each level separately
      const shuffleArray = (arr: Card[]) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = seededRandom(0, i);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Shuffle each level
      const shuffledByLevel = {
        1: shuffleArray(cardsByLevel[1]),
        2: shuffleArray(cardsByLevel[2]),
        3: shuffleArray(cardsByLevel[3]),
        4: shuffleArray(cardsByLevel[4]),
      };

      // Interleave cards from different levels to ensure diversity
      const result: Card[] = [];
      const maxLength = Math.max(
        shuffledByLevel[1].length,
        shuffledByLevel[2].length,
        shuffledByLevel[3].length,
        shuffledByLevel[4].length
      );

      for (let i = 0; i < maxLength; i++) {
        if (shuffledByLevel[1][i]) result.push(shuffledByLevel[1][i]);
        if (shuffledByLevel[2][i]) result.push(shuffledByLevel[2][i]);
        if (shuffledByLevel[3][i]) result.push(shuffledByLevel[3][i]);
        if (shuffledByLevel[4][i]) result.push(shuffledByLevel[4][i]);
      }

      return result.slice(0, targetCount);
    };

    // Use the improved shuffle that ensures level diversity
    const cardsToShow = room.settings.cardsPerPlayer + 2;
    const selectedCards = deterministicShuffleWithLevelBalance(
      availableCards,
      player.id,
      cardsToShow
    );

    // Level distribution calculations complete

    setAvailableCards(selectedCards);
  }, [room, player]);

  const handleCardSelect = (card: Card) => {
    if (selectedCards.length >= (room?.settings.cardsPerPlayer || 0)) return;

    // Check if card is already selected by this player
    const isAlreadySelected = selectedCards.some((c) => c.word === card.word);
    if (isAlreadySelected) return;

    setSelectedCards((prev) => [...prev, card]);
  };

  const handleCardDeselect = (cardWord: string) => {
    setSelectedCards((prev) => prev.filter((card) => card.word !== cardWord));
  };

  const handleConfirmSelection = () => {
    if (!room || selectedCards.length !== room.settings.cardsPerPlayer) return;

    // Convert Card format from GameScreen to roomManager format
    const convertedCards = selectedCards.map((card) => ({
      id: card.word, // Use word as id
      text: card.word,
      round: 1,
    }));

    // Update player's selected cards in room
    roomManager.updatePlayerCards(roomId, player.id, convertedCards);

    // Check if all players have selected cards
    const updatedRoom = roomManager.getRoom(roomId);
    if (updatedRoom) {
      const allPlayersHaveCards = updatedRoom.players.every(
        (p) =>
          p.selectedCards &&
          p.selectedCards.length === room.settings.cardsPerPlayer
      );

      if (allPlayersHaveCards) {
        // All players have selected cards, start the game
        roomManager.updateGameState(roomId, 'playing');
        onSelectionComplete(selectedCards);
      }
    }
  };

  const getPlayerProgress = () => {
    if (!room) return { completed: 0, total: 0 };

    const completed = room.players.filter(
      (p) =>
        p.selectedCards &&
        p.selectedCards.length === room.settings.cardsPerPlayer
    ).length;

    return { completed, total: room.players.length };
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  const progress = getPlayerProgress();
  const cardsNeeded = room.settings.cardsPerPlayer;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Card Selection</h1>
          <p className="text-gray-400 mb-4">
            Room: {roomId.toUpperCase()} • {progress.completed}/{progress.total}{' '}
            players ready
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(progress.completed / progress.total) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Player Status */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Select Your Cards</h2>
            <p className="text-gray-400">
              You have {availableCards.length} cards to choose from. Select{' '}
              {cardsNeeded} cards for your team.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              (Showing {cardsNeeded + 2} options, choose {cardsNeeded})
            </p>
          </div>
        </div>

        {/* Player List with Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {room.players.map((p) => (
            <div
              key={p.id}
              className={`p-3 rounded-lg border-2 ${p.selectedCards && p.selectedCards.length === cardsNeeded
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-gray-700 bg-gray-800'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                <span
                  className={`text-sm ${p.selectedCards && p.selectedCards.length === cardsNeeded
                      ? 'text-green-400'
                      : 'text-yellow-400'
                    }`}
                >
                  {p.selectedCards?.length || 0}/{cardsNeeded}
                </span>
              </div>
              {p.id === player.id && (
                <span className="text-xs text-blue-400">(You)</span>
              )}
              {p.selectedCards && p.selectedCards.length === cardsNeeded && (
                <span className="text-xs text-green-400">✓ Ready</span>
              )}
            </div>
          ))}
        </div>

        {/* Card Selection Area */}
        <div className="space-y-6">
          {/* Selected Cards */}
          {selectedCards.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Your Selected Cards ({selectedCards.length}/{cardsNeeded})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {selectedCards.map((card) => (
                  <div
                    key={card.word}
                    className="bg-blue-500/20 border border-blue-500 p-4 rounded-lg cursor-pointer hover:bg-blue-500/30"
                    onClick={() => handleCardDeselect(card.word)}
                  >
                    <h2 className="font-bold text-center text-2xl mb-2">
                      {card.word}
                    </h2>
                    <p className="text-center text-sm text-gray-400 mb-2">
                      Level {card.level}
                    </p>
                    <p className="text-sm text-center">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCards.map((card) => {
                const isSelected = selectedCards.some(
                  (c) => c.word === card.word
                );

                return (
                  <div
                    key={card.word}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${isSelected
                        ? 'bg-blue-500/20 border border-blue-500'
                        : 'bg-gray-800 border border-gray-700 hover:border-blue-500 hover:bg-gray-700'
                      }`}
                    onClick={() => handleCardSelect(card)}
                  >
                    <h2 className="font-bold text-center text-2xl mb-2">
                      {card.word}
                    </h2>
                    <p className="text-center text-sm text-gray-400 mb-2">
                      Level {card.level}
                    </p>
                    <p className="text-sm text-center">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Button */}
          {selectedCards.length === cardsNeeded && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-xl shadow-green-500/20"
                onClick={handleConfirmSelection}
              >
                Confirm Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
