'use client';

import { useState, useEffect } from 'react';
import cards1 from '@/data/cards-level1.json';
import cards2 from '@/data/cards-level2.json';
import cards3 from '@/data/cards-level3.json';
import cards4 from '@/data/cards-level4.json';
import { Card } from './GameScreen';

interface Props {
  players: number;
  cardsPerPlayer: number;
  onSelectionEnd: (cards: Card[]) => void;
}

const cards: Card[] = [...cards1, ...cards2, ...cards3, ...cards4];

export default function CardSelectionScreen({
  players,
  cardsPerPlayer,
  onSelectionEnd,
}: Props) {
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [allSelectedCards, setAllSelectedCards] = useState<Card[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const cardsToShuffle =
      allSelectedCards.length > 0
        ? cards.filter(
            (card) =>
              !allSelectedCards.some((selected) => selected.word === card.word)
          )
        : cards;
    // Shuffle cards and get 2x the amount needed for the current player
    const shuffled = [...cardsToShuffle].sort(() => 0.5 - Math.random());
    setAvailableCards(shuffled.slice(0, cardsPerPlayer + 2));
  }, [currentPlayer, cardsPerPlayer, allSelectedCards]);

  const handleCardSelect = (card: Card) => {
    const isSelected = selectedCards.find((c) => c.word === card.word);

    if (isSelected) {
      setSelectedCards(selectedCards.filter((c) => c.word !== card.word));
    } else if (selectedCards.length < cardsPerPlayer) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleNextPlayer = () => {
    const newAllSelectedCards = allSelectedCards.concat(selectedCards);
    setAllSelectedCards(newAllSelectedCards);

    if (currentPlayer < players) {
      setCurrentPlayer(currentPlayer + 1);
      setSelectedCards([]);
      setIsReady(false);
    } else {
      onSelectionEnd(newAllSelectedCards);
    }
  };

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh px-4 py-6">
        <h1 className="text-4xl font-bold mb-4">Player {currentPlayer}</h1>
        <p className="text-xl mb-8">Get ready to pick your cards.</p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full cursor-pointer shadow-xl shadow-blue-500/20 text-2xl"
          onClick={() => setIsReady(true)}
        >
          I&apos;m Ready
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">
        Player {currentPlayer}, pick {cardsPerPlayer} cards
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {availableCards.map((card) => (
          <div
            key={card.word}
            className={`p-4 border rounded-lg cursor-pointer ${selectedCards.find((c) => c.word === card.word) ? 'bg-blue-500' : 'bg-gray-800'}`}
            onClick={() => handleCardSelect(card)}
          >
            <h2 className="font-bold text-center text-xl">{card.word}</h2>
            <p className="text-center mb-4">Level {card.level}</p>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
      {selectedCards.length === cardsPerPlayer && (
        <div className="bg-gradient-to-t from-gray-950 from-25% to-gray-900/0 p-14 w-full fixed bottom-0 flex justify-center">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full cursor-pointer shadow-xl shadow-blue-500/20"
            onClick={handleNextPlayer}
            disabled={selectedCards.length !== cardsPerPlayer}
          >
            {currentPlayer < players ? 'Next Player' : 'Done'}
          </button>
        </div>
      )}
    </div>
  );
}
