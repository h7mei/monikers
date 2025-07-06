'use client'

import { useState } from 'react'
import SetupScreen from '@/components/SetupScreen'
import CardSelectionScreen from '@/components/CardSelectionScreen'
import GameScreen, { Card } from '@/components/GameScreen'
import ScoreScreen from '@/components/ScoreScreen'

export default function Home() {
  const [stage, setStage] = useState('setup')
  const [players, setPlayers] = useState(0)
  const [cardsPerPlayer, setCardsPerPlayer] = useState(0)
  const [allCards, setAllCards] = useState<Card[]>([])
  const [scores, setScores] = useState<Record<string, Card[]>>({})

  const handleGameStart = (playerCount: number, cardCount: number) => {
    setPlayers(playerCount)
    setCardsPerPlayer(cardCount)
    setStage('card-selection')
  }

  const handleCardSelectionEnd = (selectedCards: Card[]) => {
    setAllCards(selectedCards)
    setStage('game')
  }

  const handleGameEnd = (finalScores: Record<string, Card[]>) => {
    setScores(finalScores)
    setStage('score')
  }

  const handlePlayAgain = () => {
    setStage('setup')
    setPlayers(0)
    setCardsPerPlayer(0)
    setAllCards([])
    setScores({})
  }

  return (
    <main className='bg-gray-900'>
      {stage === 'setup' && <SetupScreen onStartGame={handleGameStart} />}
      {stage === 'card-selection' && (
        <CardSelectionScreen
          players={players}
          cardsPerPlayer={cardsPerPlayer}
          onSelectionEnd={handleCardSelectionEnd}
        />
      )}
      {stage === 'game' && (
        <GameScreen initialCards={allCards} onGameEnd={handleGameEnd} />
      )}
      {stage === 'score' && (
        <ScoreScreen scores={scores} onPlayAgain={handlePlayAgain} />
      )}
    </main>
  )
}
