'use client';

import { useState } from 'react';
import { Input } from './ui/input';

interface Props {
  onStartGame: (players: number, cards: number) => void;
}

export default function SetupScreen({ onStartGame }: Props) {
  const [players, setPlayers] = useState(2);
  const [cards, setCards] = useState(5);

  return (
    <div className="flex flex-col items-center justify-center h-svh">
      <h1 className="text-4xl font-bold mb-8">Monikers</h1>
      <div className="w-64">
        <div className="mb-4">
          <label
            htmlFor="players"
            className="block text-sm font-medium text-gray-50"
          >
            Number of Players
          </label>
          <Input
            id="players"
            type="number"
            value={players}
            onChange={(e) => setPlayers(parseInt(e.target.value))}
            min={2}
          />
        </div>
        <div className="mb-8">
          <label
            htmlFor="cards"
            className="block text-sm font-medium text-gray-50"
          >
            Cards per Player
          </label>
          <Input
            id="cards"
            type="number"
            value={cards}
            onChange={(e) => setCards(parseInt(e.target.value))}
            min={1}
          />
        </div>
        <button
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => onStartGame(players, cards)}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
