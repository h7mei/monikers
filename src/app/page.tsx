'use client';

import { useState, useEffect } from 'react';
import SetupScreen from '@/components/single/SetupScreen';
import CardSelectionScreen from '@/components/single/CardSelectionScreen';
import GameScreen, {
  Card,
  ScoresByRound,
} from '@/components/single/GameScreen';
import ScoreScreen from '@/components/single/ScoreScreen';
import { } from '@/lib/roomManager';

export default function Home() {
  const [mode, setMode] = useState<'menu' | 'single'>('menu');

  // Single player state
  const [stage, setStage] = useState('setup');
  const [players, setPlayers] = useState(0);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(0);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [scores, setScores] = useState<ScoresByRound>({
    team1: {},
    team2: {},
  });
  const [round, setRound] = useState(1);

  const handleSinglePlayer = () => {
    setMode('single');
    setStage('setup');
  };

  const handleMultiplayer = () => {
    window.location.href = '/multiplayer';
  };

  const handleBackToMenu = () => {
    setMode('menu');
    setStage('setup');
    setPlayers(0);
    setCardsPerPlayer(0);
    setAllCards([]);
    setScores({
      team1: {},
      team2: {},
    });
    setRound(1);
  };

  // Single player handlers
  const handleGameStart = (playerCount: number, cardCount: number) => {
    setPlayers(playerCount);
    setCardsPerPlayer(cardCount);
    setStage('card-selection');
  };

  const handleCardSelectionEnd = (selectedCards: Card[]) => {
    setAllCards(selectedCards);
    setStage('game');
  };

  const handleRoundEnd = (roundScores: ScoresByRound) => {
    setScores(roundScores);
    setStage('round-score');
  };

  const handleNextRound = () => {
    setRound((prev) => prev + 1);
    setStage('game');
  };

  const handleGameEnd = (finalScores: ScoresByRound) => {
    setScores(finalScores);
    setStage('score');
  };

  const handlePlayAgain = () => {
    setStage('setup');
    setPlayers(0);
    setCardsPerPlayer(0);
    setAllCards([]);
    setScores({
      team1: {},
      team2: {},
    });
    setRound(1);
  };

  // Multiplayer now lives under /multiplayer route

  return (
    <main className="bg-gray-900">
      {mode === 'menu' && (
        <div className="flex flex-col items-center justify-center h-svh">
          <h1 className="text-4xl font-bold mb-8">Monikers</h1>
          <div className="w-64 space-y-4">
            <button
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-blue-500/20"
              onClick={handleSinglePlayer}
            >
              Single Player
            </button>
            <button
              className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-green-500/20"
              onClick={handleMultiplayer}
            >
              Multiplayer
            </button>
          </div>
          <div className="fixed bottom-8">© arfianadam</div>
        </div>
      )}

      {mode === 'single' && (
        <>
          {stage === 'setup' && <SetupScreen onStartGame={handleGameStart} />}
          {stage === 'card-selection' && (
            <CardSelectionScreen
              players={players}
              cardsPerPlayer={cardsPerPlayer}
              onSelectionEnd={handleCardSelectionEnd}
            />
          )}
          {stage === 'game' && (
            <GameScreen
              initialCards={allCards}
              onGameEnd={handleGameEnd}
              onRoundEnd={handleRoundEnd}
              round={round}
              scores={scores}
            />
          )}
          {(stage === 'score' || stage === 'round-score') && (
            <ScoreScreen
              scores={scores}
              onPlayAgain={handlePlayAgain}
              onNextRound={handleNextRound}
              isGameOver={stage === 'score'}
            />
          )}
        </>
      )}
    </main>
  );
}
