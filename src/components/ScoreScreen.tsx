'use client'

import { Card } from './GameScreen'

interface Props {
  scores: Record<string, Card[]>
  onPlayAgain: () => void
}

export default function ScoreScreen({ scores, onPlayAgain }: Props) {
  return (
    <div className='flex flex-col items-center justify-center min-h-svh p-6'>
      <h1 className='text-4xl font-bold mb-8'>Game Over</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl'>
        {Object.entries(scores).map(([team, cards]) => {
          const totalScore = cards.reduce((sum, card) => sum + card.level, 0)
          return (
            <div
              key={team}
              className='border border-white p-6 rounded-lg shadow-lg'
            >
              <h2 className='text-2xl font-bold mb-4'>
                {team === 'team1' ? 'Team 1' : 'Team 2'}: {totalScore} points
              </h2>
              <ul>
                {cards.map((card) => (
                  <li key={card.word} className='mb-2'>
                    <p className='font-bold'>{card.word} - {card.level}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <button
        onClick={onPlayAgain}
        className='mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-2xl'
      >
        Play Again
      </button>
    </div>
  )
}
