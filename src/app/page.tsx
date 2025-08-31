'use client';

import { useState, useEffect } from 'react';
import SetupScreen from '@/components/single/SetupScreen';
import MultiplayerSetupScreen from '@/components/multiplayer/SetupScreen';
import CardSelectionScreen from '@/components/single/CardSelectionScreen';
import GameScreen, {
  Card,
  ScoresByRound,
} from '@/components/single/GameScreen';
import ScoreScreen from '@/components/single/ScoreScreen';
import { GameRoom, Player, roomManager } from '@/lib/roomManager';

export default function Home() {
  const [mode, setMode] = useState<'menu' | 'single' | 'multiplayer'>('menu');

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

  // Multiplayer state
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const handleSinglePlayer = () => {
    setMode('single');
    setStage('setup');
  };

  const handleMultiplayer = () => {
    setMode('multiplayer');
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
    setRoom(null);
    setCurrentPlayer(null);
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

  // Multiplayer handlers
  const handleRoomCreated = (newRoom: GameRoom, player: Player) => {
    setRoom(newRoom);
    setCurrentPlayer(player);
  };

  const handleJoinRoom = (roomId: string, player: Player) => {
    // This would typically redirect to the room
    console.log('Joining room:', roomId, player);
  };

  // Check if game has started for the host
  useEffect(() => {
    if (!room || !currentPlayer) return;

    const checkGameState = () => {
      const updatedRoom = roomManager.getRoom(room.id);
      if (updatedRoom && updatedRoom.gameState !== 'waiting') {
        // Game has started, redirect host to game
        const gameUrl = `/join/${room.id}/waiting?playerId=${currentPlayer.id}`;
        window.location.href = gameUrl;
      }
    };

    // Check immediately
    checkGameState();

    // Poll for game state changes
    const interval = setInterval(checkGameState, 1000);

    return () => clearInterval(interval);
  }, [room, currentPlayer]);

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

      {mode === 'multiplayer' && (
        <MultiplayerSetupScreen
          onRoomCreated={handleRoomCreated}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {/* Back to menu button for multiplayer */}
      {mode === 'multiplayer' && (
        <button
          className="fixed top-4 left-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          onClick={handleBackToMenu}
        >
          ← Back to Menu
        </button>
      )}
    </main>
  );
}
