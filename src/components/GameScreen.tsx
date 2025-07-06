'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Card {
  level: number
  word: string
  description: string
}

interface Props {
  initialCards: Card[]
  onGameEnd: (scores: Record<string, Card[]>) => void
}

export default function GameScreen({ initialCards, onGameEnd }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [guessedCards, setGuessedCards] = useState<Card[]>([])
  const [scores, setScores] = useState<Record<string, Card[]>>({
    team1: [],
    team2: [],
  })
  const [currentTeam, setCurrentTeam] = useState('team1')
  const [timer, setTimer] = useState(60)
  const [isRoundActive, setIsRoundActive] = useState(false)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    setCards([...initialCards].sort(() => 0.5 - Math.random()))
  }, [initialCards])

  const endRound = useCallback(() => {
    setIsRoundActive(false)
    const newScores = {
      ...scores,
      [currentTeam]: [...scores[currentTeam], ...guessedCards],
    }
    setScores(newScores)
    const remainingCards = cards.filter(
      (c) => !guessedCards.find((gc) => gc.word === c.word)
    )
    setCards(remainingCards)
    setGuessedCards([])
    if (remainingCards.length === 0) {
      onGameEnd(newScores)
    } else {
      setCurrentTeam(currentTeam === 'team1' ? 'team2' : 'team1')
    }
  }, [cards, currentTeam, guessedCards, onGameEnd, scores])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRoundActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      endRound()
    }
    return () => clearInterval(interval)
  }, [isRoundActive, timer, endRound])

  const startRound = () => {
    setIsRoundActive(true)
    setTimer(60)
    setSkipped(false)
  }

  const handleGuess = () => {
    if (!isRoundActive || cards.length === 0) return
    const [currentCard, ...remainingCards] = cards
    setGuessedCards([...guessedCards, currentCard])
    setCards(remainingCards)
  }

  const handleSkip = () => {
    if (!isRoundActive || skipped || cards.length <= 1) return
    setSkipped(true)
    const [currentCard, ...remainingCards] = cards
    setCards([...remainingCards, currentCard]) // Move to the back of the deck
  }

  const activeCard = cards[0]

  if (!isRoundActive) {
    return (
      <div className='flex flex-col items-center justify-center h-svh'>
        <h1 className='text-4xl font-bold mb-8'>
          Team {currentTeam === 'team1' ? 1 : 2}&apos;s Turn
        </h1>
        <button
          onClick={startRound}
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-2xl'
        >
          Start Round
        </button>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center justify-center h-svh p-6'>
      <div className='text-4xl font-bold mb-4'>{timer}</div>
      {activeCard && (
        <div className='p-8 rounded-lg shadow-lg text-center mb-8 border border-gray-100'>
          <h2 className='text-3xl font-bold mb-2'>{activeCard.word}</h2>
          <p className='text-lg'>{activeCard.description}</p>
        </div>
      )}
      <div className='w-full sm:w-3xl flex justify-between'>
        <button
          onClick={handleSkip}
          disabled={skipped}
          className='bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50'
        >
          Skip
        </button>
        <button
          onClick={handleGuess}
          className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'
        >
          Guessed
        </button>
      </div>
      {skipped && (
        <p className='text-sm text-gray-500 mt-4'>
          You can only skip once per round.
        </p>
      )}
    </div>
  )
}
