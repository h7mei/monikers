'use client';

import { ScoresByRound } from './GameScreen';

interface Props {
  scores: ScoresByRound;
  onPlayAgain: () => void;
  onNextRound: () => void;
  isGameOver: boolean;
}

export default function ScoreScreen({
  scores,
  onPlayAgain,
  onNextRound,
  isGameOver,
}: Props) {
  const team1Total = Object.values(scores.team1)
    .flat()
    .reduce((sum, card) => sum + card.level, 0);
  const team2Total = Object.values(scores.team2)
    .flat()
    .reduce((sum, card) => sum + card.level, 0);
  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-6">
      <h1 className="text-4xl font-bold mb-8">
        {isGameOver ? 'Game Over' : 'Round Over'}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="border border-white p-6 rounded-lg shadow-lg flex flex-col">
          <h2 className="text-3xl font-bold mb-2 text-center">Team 1</h2>
          <p className="text-6xl font-bold text-yellow-400 mb-4 text-center">
            {team1Total}
          </p>
          <div className="flex-grow overflow-y-auto">
            {Object.entries(scores.team1).map(([round, cards]) => (
              <div key={round} className="mb-4">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">
                  Round {round}
                </h3>
                <ul>
                  {cards.map((card) => (
                    <li key={card.word} className="mb-2">
                      <p>
                        {card.word} - {card.level}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-white p-6 rounded-lg shadow-lg flex flex-col">
          <h2 className="text-3xl font-bold mb-2 text-center">Team 2</h2>
          <p className="text-6xl font-bold text-yellow-400 mb-4 text-center">
            {team2Total}
          </p>
          <div className="flex-grow overflow-y-auto">
            {Object.entries(scores.team2).map(([round, cards]) => (
              <div key={round} className="mb-4">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">
                  Round {round}
                </h3>
                <ul>
                  {cards.map((card) => (
                    <li key={card.word} className="mb-2">
                      <p>
                        {card.word} - {card.level}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isGameOver ? (
        <button
          onClick={onPlayAgain}
          className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-2xl shadow-xl shadow-blue-500/20"
        >
          Play Again
        </button>
      ) : (
        <button
          onClick={onNextRound}
          className="mt-8 bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-2xl shadow-xl shadow-green-500/20"
        >
          Next Round
        </button>
      )}
    </div>
  );
}
