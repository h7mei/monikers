'use client';

import { useCallback, useState, useEffect } from 'react';
import { roomManager, GameRoom, Player, Card } from '@/lib/roomManager';
import cards1 from '@/data/cards-level1.json';
import cards2 from '@/data/cards-level2.json';
import cards3 from '@/data/cards-level3.json';
import cards4 from '@/data/cards-level4.json';
import { Card as GameCard } from '@/components/single/GameScreen';

interface Props {
  roomId: string;
  player: Player;
  onGameEnd: () => void;
}

// Combine all card data
const allCardData: GameCard[] = [...cards1, ...cards2, ...cards3, ...cards4];

export default function MultiplayerGameScreen({ roomId, player }: Props) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentTeam, setCurrentTeam] = useState<'team1' | 'team2'>('team1');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timer, setTimer] = useState(60);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [scores, setScores] = useState<Record<string, Record<number, Card[]>>>({
    team1: {},
    team2: {},
  });
  const [currentRound, setCurrentRound] = useState(1);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [roundStarted, setRoundStarted] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showGameSummary, setShowGameSummary] = useState(false);
  // Individual player state
  const [playerTimers, setPlayerTimers] = useState<Record<string, number>>({});
  const [playerSkipCounts, setPlayerSkipCounts] = useState<
    Record<string, number>
  >({});
  const [turnStarted, setTurnStarted] = useState(false);

  // Load room data
  useEffect(() => {
    const loadRoom = () => {
      const roomData = roomManager.getRoom(roomId);
      if (roomData) {
        setRoom(roomData);
        setCurrentRound(roomData.currentRound || 1);
        setScores(roomData.scores || { team1: {}, team2: {} });

        // Sync game state from room
        if (roomData.currentTeam) setCurrentTeam(roomData.currentTeam);
        if (roomData.timer !== undefined) setTimer(roomData.timer);
        if (roomData.isRoundActive !== undefined)
          setIsRoundActive(roomData.isRoundActive);
        if (roomData.roundStarted !== undefined)
          setRoundStarted(roomData.roundStarted);
        if (roomData.currentPlayerIndex !== undefined)
          setCurrentPlayerIndex(roomData.currentPlayerIndex);
        if (roomData.usedCards) setUsedCards(new Set(roomData.usedCards));
        if (roomData.currentCard !== undefined)
          setCurrentCard(roomData.currentCard);
        // Sync individual player state
        if (roomData.playerTimers) setPlayerTimers(roomData.playerTimers);
        if (roomData.playerSkipCounts)
          setPlayerSkipCounts(roomData.playerSkipCounts);
        if (roomData.turnStarted !== undefined)
          setTurnStarted(roomData.turnStarted);

        // Load all selected cards from all players and get actual descriptions and levels
        const allSelectedCards = roomManager.getAllSelectedCards(roomId);
        const cardsWithDescriptions = allSelectedCards.map((card) => {
          // Find the actual card data to get the description and level
          const actualCard = allCardData.find(
            (c: GameCard) => c.word === card.text
          );
          return {
            ...card,
            id: card.text, // Ensure consistent ID mapping
            description: actualCard?.description || `Describe: ${card.text}`,
            level: actualCard?.level || 1, // Add level information
          };
        });

        // Randomize the entire card pool
        const shuffledCards = [...cardsWithDescriptions].sort(
          () => Math.random() - 0.5
        );
        setAllCards(shuffledCards);
      }
    };

    loadRoom();
    const interval = setInterval(loadRoom, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Initialize game when all cards are loaded
  useEffect(() => {
    if (allCards.length > 0 && !isRoundActive && !roundStarted && room) {
      // Game is ready, waiting for team to start
      setCurrentPlayerIndex(0);
      setCurrentTeam('team1');
      setUsedCards(new Set());
    }
  }, [allCards, room, isRoundActive, roundStarted]);

  const startRound = () => {
    if (!room) return;

    setIsRoundActive(true);
    setRoundStarted(true);
    setTimer(60);
    setShowRoundSummary(false);

    // Sync state to roomManager for all players
    roomManager.updateRoundStatus(roomId, true, true);
    roomManager.updateTimer(roomId, 60);
    roomManager.updateCurrentTeam(roomId, 'team1');
    roomManager.updateCurrentPlayer(roomId, 0);

    // Get first card for current player
    const currentPlayer = room.players[currentPlayerIndex];
    if (currentPlayer) {
      const nextCard = getNextCard();
      setCurrentCard(nextCard);
      roomManager.updateCurrentCard(roomId, nextCard);
    }
  };

  const getNextCard = useCallback((): Card | null => {
    // Get cards for the current player's team that haven't been answered correctly
    const teamCards = allCards.filter((card) => {
      const playerWithCard = room?.players.find((p) =>
        p.selectedCards?.some((c) => c.id === card.text || c.id === card.id)
      );
      return (
        playerWithCard?.team === currentTeam &&
        !usedCards.has(card.text) &&
        !usedCards.has(card.id)
      );
    });

    if (teamCards.length === 0) return null;
    return teamCards[0];
  }, [allCards, room?.players, currentTeam, usedCards]);

  const skipCurrentCard = () => {
    if (!currentCard) return;

    // Find the current card in the team's available cards
    const teamCards = allCards.filter((card) => {
      const playerWithCard = room?.players.find((p) =>
        p.selectedCards?.some((c) => c.id === card.text || c.id === card.id)
      );
      return (
        playerWithCard?.team === currentTeam &&
        !usedCards.has(card.text) &&
        !usedCards.has(card.id)
      );
    });

    // Remove the current card from the front and add it to the back
    const currentCardIndex = teamCards.findIndex(
      (card) => card.id === currentCard.id || card.text === currentCard.text
    );
    if (currentCardIndex !== -1) {
      const [skippedCard, ...remainingCards] = teamCards;
      const reorderedCards = [...remainingCards, skippedCard];

      // Get the next card (first card after reordering)
      const nextCard = reorderedCards[0];
      if (nextCard) {
        setCurrentCard(nextCard);
        roomManager.updateCurrentCard(roomId, nextCard);
      }
    }
  };

  const handleCorrectGuess = () => {
    if (!room || !currentCard) return;

    // Add card to team's score
    const newScores = { ...scores };
    if (!newScores[currentTeam][currentRound]) {
      newScores[currentTeam][currentRound] = [];
    }
    newScores[currentTeam][currentRound].push(currentCard);

    setScores(newScores);
    const newUsedCards = new Set([
      ...usedCards,
      currentCard.text || currentCard.id,
    ]);
    setUsedCards(newUsedCards);

    // Update room scores and used cards
    roomManager.updateScores(roomId, newScores);
    roomManager.updateUsedCards(roomId, Array.from(newUsedCards));

    // Reset skip count for current player when they answer correctly
    const currentPlayer = room.players[currentPlayerIndex];
    if (currentPlayer) {
      const newPlayerSkipCounts = {
        ...playerSkipCounts,
        [currentPlayer.id]: 0,
      };
      setPlayerSkipCounts(newPlayerSkipCounts);
      roomManager.updatePlayerSkipCount(roomId, currentPlayer.id, 0);

      // Get next card for current player (don't move to next player)
      const nextCard = getNextCard();
      if (nextCard) {
        setCurrentCard(nextCard);
        roomManager.updateCurrentCard(roomId, nextCard);
      }
    }
  };

  const handleSkipCard = () => {
    if (!currentCard) return;

    // Increment skip count for current player
    const currentPlayer = room?.players[currentPlayerIndex];
    if (currentPlayer) {
      const currentSkipCount = playerSkipCounts[currentPlayer.id] || 0;
      const newSkipCount = currentSkipCount + 1;
      const newPlayerSkipCounts = {
        ...playerSkipCounts,
        [currentPlayer.id]: newSkipCount,
      };
      setPlayerSkipCounts(newPlayerSkipCounts);
      roomManager.updatePlayerSkipCount(roomId, currentPlayer.id, newSkipCount);
    }

    // Skip the card (move to back of deck) but don't mark as used
    skipCurrentCard();
  };

  const handleEndTurn = () => {
    // Reset timer for current player and move to next player
    const currentPlayer = room?.players[currentPlayerIndex];
    if (currentPlayer) {
      const newPlayerTimers = { ...playerTimers, [currentPlayer.id]: 60 };
      setPlayerTimers(newPlayerTimers);
      roomManager.updatePlayerTimer(roomId, currentPlayer.id, 60);
    }

    // Simply move to next player without marking card as used
    moveToNextPlayer();
  };

  const startCurrentPlayerTurn = () => {
    if (!room) return;

    const currentPlayer = room.players[currentPlayerIndex];
    if (!currentPlayer) return;

    // Start the turn for the current player
    setTurnStarted(true);
    roomManager.updateTurnStarted(roomId, true);

    // Initialize player timer if not exists
    if (!playerTimers[currentPlayer.id]) {
      const newPlayerTimers = { ...playerTimers, [currentPlayer.id]: 60 };
      setPlayerTimers(newPlayerTimers);
      roomManager.updatePlayerTimer(roomId, currentPlayer.id, 60);
    }

    // Initialize skip count if not exists
    if (!playerSkipCounts[currentPlayer.id]) {
      const newPlayerSkipCounts = {
        ...playerSkipCounts,
        [currentPlayer.id]: 0,
      };
      setPlayerSkipCounts(newPlayerSkipCounts);
      roomManager.updatePlayerSkipCount(roomId, currentPlayer.id, 0);
    }

    // Ensure current card is set for the player
    if (!currentCard) {
      const nextCard = getNextCard();
      if (nextCard) {
        setCurrentCard(nextCard);
        roomManager.updateCurrentCard(roomId, nextCard);
      }
    }
  };

  const moveToNextPlayer = () => {
    if (!room) return;

    // Reset turn started for the new player
    setTurnStarted(false);
    roomManager.updateTurnStarted(roomId, false);

    // Find all players in the current team
    const currentTeamPlayers = room.players.filter(
      (p) => p.team === currentTeam
    );
    const currentTeamPlayerIndices = currentTeamPlayers.map((p) =>
      room.players.findIndex((player) => player.id === p.id)
    );

    // Find the next player within the same team
    const currentPlayerInTeamIndex =
      currentTeamPlayerIndices.indexOf(currentPlayerIndex);
    const nextPlayerInTeamIndex =
      (currentPlayerInTeamIndex + 1) % currentTeamPlayerIndices.length;
    const nextPlayerIndex = currentTeamPlayerIndices[nextPlayerInTeamIndex];

    // Check if we've completed a full rotation of the current team
    if (nextPlayerInTeamIndex === 0) {
      // Switch to the other team
      const newTeam = currentTeam === 'team1' ? 'team2' : 'team1';
      setCurrentTeam(newTeam);

      // Find the first player of the new team
      const newTeamPlayers = room.players.filter((p) => p.team === newTeam);
      if (newTeamPlayers.length > 0) {
        const firstNewTeamPlayerIndex = room.players.findIndex(
          (p) => p.id === newTeamPlayers[0].id
        );
        setCurrentPlayerIndex(firstNewTeamPlayerIndex);

        // Sync to roomManager
        roomManager.updateCurrentTeam(roomId, newTeam);
        roomManager.updateCurrentPlayer(roomId, firstNewTeamPlayerIndex);

        const nextPlayer = room.players[firstNewTeamPlayerIndex];
        if (nextPlayer) {
          const nextCard = getNextCard();
          setCurrentCard(nextCard);
          roomManager.updateCurrentCard(roomId, nextCard);
        }
      }
    } else {
      // Continue with next player in same team
      setCurrentPlayerIndex(nextPlayerIndex);

      // Sync to roomManager
      roomManager.updateCurrentPlayer(roomId, nextPlayerIndex);

      const nextPlayer = room.players[nextPlayerIndex];
      if (nextPlayer) {
        const nextCard = getNextCard();
        setCurrentCard(nextCard);
        roomManager.updateCurrentCard(roomId, nextCard);
      }
    }

    // Check if round is complete
    if (usedCards.size >= allCards.length) {
      endRound();
    }
  };

  const endRound = () => {
    setIsRoundActive(false);
    setShowRoundSummary(true);

    // Show round summary for 5 seconds
    setTimeout(() => {
      setShowRoundSummary(false);

      if (currentRound < 3) {
        // Start next round
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        roomManager.updateCurrentRound(roomId, nextRound);

        // Reset for next round
        setRoundStarted(false);
        setUsedCards(new Set());
        setCurrentPlayerIndex(0);
        setCurrentTeam('team1');
      } else {
        // Game finished
        setShowGameSummary(true);
        roomManager.updateGameState(roomId, 'finished');
      }
    }, 5000);
  };

  const switchTeams = useCallback(() => {
    if (!room) return;

    // Switch to the other team
    const newTeam = currentTeam === 'team1' ? 'team2' : 'team1';
    setCurrentTeam(newTeam);

    // Find the first player of the new team
    const newTeamPlayers = room.players.filter((p) => p.team === newTeam);
    if (newTeamPlayers.length > 0) {
      const firstNewTeamPlayerIndex = room.players.findIndex(
        (p) => p.id === newTeamPlayers[0].id
      );
      setCurrentPlayerIndex(firstNewTeamPlayerIndex);

      // Sync to roomManager
      roomManager.updateCurrentTeam(roomId, newTeam);
      roomManager.updateCurrentPlayer(roomId, firstNewTeamPlayerIndex);

      // Get the next card for the new current player
      const nextCard = getNextCard();
      setCurrentCard(nextCard);
      roomManager.updateCurrentCard(roomId, nextCard);
    }
  }, [room, currentTeam, roomId, getNextCard]);

  // Timer countdown
  useEffect(() => {
    if (!isRoundActive || !turnStarted) return;

    const currentPlayer = room?.players[currentPlayerIndex];
    if (!currentPlayer) return;

    const currentPlayerTimer = playerTimers[currentPlayer.id];
    if (currentPlayerTimer === undefined || currentPlayerTimer <= 0) return;

    const interval = setInterval(() => {
      setPlayerTimers((prev) => {
        const newTimer = prev[currentPlayer.id] - 1;
        const newPlayerTimers = { ...prev, [currentPlayer.id]: newTimer };

        // Sync timer to roomManager
        roomManager.updatePlayerTimer(roomId, currentPlayer.id, newTimer);

        if (newTimer <= 0) {
          // Time's up, switch teams
          switchTeams();
        }

        return newPlayerTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isRoundActive,
    turnStarted,
    currentPlayerIndex,
    room,
    playerTimers,
    roomId,
    switchTeams,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPlayer = () => {
    return room?.players[currentPlayerIndex];
  };

  const isMyTurn = getCurrentPlayer()?.id === player.id;
  const isHost = player.isHost;

  const getTeamScore = (team: string, round: number) => {
    return (
      scores[team]?.[round]?.reduce((sum, card) => {
        // Handle both Card interface (from roomManager) and GameCard interface (from GameScreen)
        const cardLevel = (card as unknown as { level?: number }).level || 1; // Default to level 1 if level is not available
        return sum + cardLevel;
      }, 0) || 0
    );
  };

  const getTeamCardCount = (team: string, round: number) => {
    return scores[team]?.[round]?.length || 0;
  };

  const getTotalTeamScore = (team: string) => {
    return [1, 2, 3].reduce(
      (total, round) => total + getTeamScore(team, round),
      0
    );
  };

  const getWinner = () => {
    const team1Total = getTotalTeamScore('team1');
    const team2Total = getTotalTeamScore('team2');

    if (team1Total > team2Total) return 'Team 1';
    if (team2Total > team1Total) return 'Team 2';
    return 'Tie';
  };

  // Check if all questions are answered for current round
  const areAllQuestionsAnswered = () => {
    const totalCards = (room?.settings.cardsPerPlayer || 0) * 2; // Total cards for both teams
    const answeredCards =
      getTeamCardCount('team1', currentRound) +
      getTeamCardCount('team2', currentRound);
    return answeredCards >= totalCards;
  };

  // Show round result monitor when all questions are answered
  const showRoundResultMonitor = areAllQuestionsAnswered() && isRoundActive;

  // Check if game has been ended by host
  useEffect(() => {
    if (room && room.gameState === 'finished') {
      // Game has been ended, redirect to home
      window.location.href = '/';
    }
  }, [room, room?.gameState]);

  // Check if room has been deleted
  useEffect(() => {
    const checkRoomExists = () => {
      const currentRoom = roomManager.getRoom(roomId);
      if (!currentRoom) {
        // Room has been deleted, redirect to home
        window.location.href = '/';
      }
    };

    // Check immediately
    checkRoomExists();

    // Set up interval to check periodically
    const interval = setInterval(checkRoomExists, 2000);

    return () => clearInterval(interval);
  }, [roomId]);

  // Ensure current card is set when turn changes
  useEffect(() => {
    if (roundStarted && isRoundActive && !currentCard) {
      const currentPlayer = room?.players[currentPlayerIndex];
      if (currentPlayer) {
        const nextCard = getNextCard();
        if (nextCard) {
          setCurrentCard(nextCard);
          roomManager.updateCurrentCard(roomId, nextCard);
        }
      }
    }
  }, [
    currentPlayerIndex,
    currentTeam,
    roundStarted,
    isRoundActive,
    currentCard,
    room,
    getNextCard,
    roomId,
  ]);

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold">Loading game...</h1>
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();
  const roundDescription = `Round ${currentRound}: ${
    currentRound === 1
      ? 'Free Talking'
      : currentRound === 2
        ? 'One Word'
        : 'Expressions'
  }`;

  // Show round result monitor when all questions are answered
  if (showRoundResultMonitor) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8">
            Round {currentRound} Complete!
          </h1>

          <div className="bg-yellow-500/20 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              All Questions Answered!
            </h2>
            <p className="text-lg text-gray-300">
              Both teams have answered all their questions for this round.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-500/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">Team 1</h2>
              <div className="text-4xl font-bold">
                {getTeamCardCount('team1', currentRound)}
              </div>
              <p className="text-gray-400">cards answered</p>
            </div>
            <div className="bg-green-500/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-green-400 mb-4">Team 2</h2>
              <div className="text-4xl font-bold">
                {getTeamCardCount('team2', currentRound)}
              </div>
              <p className="text-gray-400">cards answered</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold mb-4">
              Round {currentRound} Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-gray-400">Team 1 Score</p>
                <p className="text-2xl font-bold text-blue-400">
                  {getTeamScore('team1', currentRound)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Team 2 Score</p>
                <p className="text-2xl font-bold text-green-400">
                  {getTeamScore('team2', currentRound)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-400">Round Winner</p>
              <p className="text-xl font-bold text-yellow-400">
                {getTeamScore('team1', currentRound) >
                getTeamScore('team2', currentRound)
                  ? 'Team 1'
                  : getTeamScore('team2', currentRound) >
                      getTeamScore('team1', currentRound)
                    ? 'Team 2'
                    : 'Tie'}
              </p>
            </div>
          </div>

          {isHost && currentRound < 3 && (
            <div className="mb-8">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-xl"
                onClick={() => {
                  // Move to next round
                  const nextRound = currentRound + 1;
                  setCurrentRound(nextRound);
                  roomManager.updateCurrentRound(roomId, nextRound);

                  // Reset round state
                  setRoundStarted(false);
                  setTurnStarted(false);
                  setCurrentCard(null);
                  setUsedCards(new Set());
                  setPlayerTimers({});
                  setPlayerSkipCounts({});

                  // Sync to roomManager
                  roomManager.updateRoundStatus(roomId, false, false);
                  roomManager.updateCurrentCard(roomId, null);
                  roomManager.updateUsedCards(roomId, []);

                  // Set initial team
                  const firstTeam1Player = room.players.find(
                    (p) => p.team === 'team1'
                  );
                  if (firstTeam1Player) {
                    const playerIndex = room.players.findIndex(
                      (p) => p.id === firstTeam1Player.id
                    );
                    setCurrentPlayerIndex(playerIndex);
                    setCurrentTeam('team1');
                    roomManager.updateCurrentPlayer(roomId, playerIndex);
                    roomManager.updateCurrentTeam(roomId, 'team1');
                  }
                }}
              >
                Start Round {currentRound + 1}
              </button>
            </div>
          )}

          {!isHost && currentRound < 3 && (
            <div className="text-xl text-gray-400 mb-8">
              Waiting for host to start Round {currentRound + 1}...
            </div>
          )}

          {currentRound >= 3 && (
            <div className="mb-8">
              {/* Final Game Summary */}
              <div className="bg-gray-800 p-6 rounded-lg mb-8">
                <h3 className="text-2xl font-bold mb-6">Final Game Summary</h3>

                {/* All Rounds Summary */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-500/20 p-4 rounded-lg">
                    <h4 className="text-lg font-bold text-blue-400 mb-3">
                      Team 1
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Round 1:</span>
                        <span className="font-bold">
                          {getTeamScore('team1', 1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Round 2:</span>
                        <span className="font-bold">
                          {getTeamScore('team1', 2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Round 3:</span>
                        <span className="font-bold">
                          {getTeamScore('team1', 3)}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-blue-400">
                          {getTotalTeamScore('team1')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-500/20 p-4 rounded-lg">
                    <h4 className="text-lg font-bold text-green-400 mb-3">
                      Team 2
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Round 1:</span>
                        <span className="font-bold">
                          {getTeamScore('team2', 1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Round 2:</span>
                        <span className="font-bold">
                          {getTeamScore('team2', 2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Round 3:</span>
                        <span className="font-bold">
                          {getTeamScore('team2', 3)}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-green-400">
                          {getTotalTeamScore('team2')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Game Winner */}
                <div className="bg-yellow-500/20 p-4 rounded-lg mb-6">
                  <h4 className="text-xl font-bold text-yellow-400 mb-2">
                    🏆 Game Winner
                  </h4>
                  <p className="text-2xl font-bold text-yellow-400">
                    {getWinner()}
                  </p>
                </div>

                {/* Detailed Card Report */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-bold mb-4">
                    📋 Detailed Card Report
                  </h4>
                  <div className="space-y-4">
                    {[1, 2, 3].map((round) => (
                      <div
                        key={round}
                        className="border border-gray-600 rounded-lg p-3"
                      >
                        <h5 className="font-bold text-lg mb-2">
                          Round {round}:{' '}
                          {round === 1
                            ? 'Free Talking'
                            : round === 2
                              ? 'One Word'
                              : 'Expressions'}
                        </h5>

                        {/* Team 1 Cards */}
                        <div className="mb-3">
                          <h6 className="font-semibold text-blue-400 mb-1">
                            Team 1 Cards:
                          </h6>
                          {scores['team1']?.[round]?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {scores['team1'][round].map((card, index) => {
                                const playerWithCard = room.players.find((p) =>
                                  p.selectedCards?.some((c) => c.id === card.id)
                                );
                                return (
                                  <div
                                    key={index}
                                    className="bg-blue-500/10 p-2 rounded text-sm"
                                  >
                                    <span className="font-semibold">
                                      &quot;{card.text}&quot;
                                    </span>
                                    <br />
                                    <span className="text-gray-400 text-xs">
                                      Selected by:{' '}
                                      {playerWithCard?.name || 'Unknown'}
                                    </span>
                                    <br />
                                    <span className="text-yellow-400 text-xs">
                                      Level{' '}
                                      {(card as unknown as { level?: number })
                                        .level || 1}{' '}
                                      (
                                      {(card as unknown as { level?: number })
                                        .level || 1}{' '}
                                      points)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">
                              No cards answered
                            </p>
                          )}
                        </div>

                        {/* Team 2 Cards */}
                        <div>
                          <h6 className="font-semibold text-green-400 mb-1">
                            Team 2 Cards:
                          </h6>
                          {scores['team2']?.[round]?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {scores['team2'][round].map((card, index) => {
                                const playerWithCard = room.players.find((p) =>
                                  p.selectedCards?.some((c) => c.id === card.id)
                                );
                                return (
                                  <div
                                    key={index}
                                    className="bg-green-500/10 p-2 rounded text-sm"
                                  >
                                    <span className="font-semibold">
                                      &quot;{card.text}&quot;
                                    </span>
                                    <br />
                                    <span className="text-gray-400 text-xs">
                                      Selected by:{' '}
                                      {playerWithCard?.name || 'Unknown'}
                                    </span>
                                    <br />
                                    <span className="text-yellow-400 text-xs">
                                      Level{' '}
                                      {(card as unknown as { level?: number })
                                        .level || 1}{' '}
                                      (
                                      {(card as unknown as { level?: number })
                                        .level || 1}{' '}
                                      points)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">
                              No cards answered
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isHost ? (
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full"
                  onClick={() => {
                    // Clean up the room completely
                    roomManager.updateGameState(roomId, 'finished');
                    roomManager.deleteRoom(roomId);

                    // Redirect all players to home
                    window.location.href = '/';
                  }}
                >
                  End Game
                </button>
              ) : (
                <div className="text-xl text-gray-400 mb-4">
                  Waiting for host to end the game...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show round summary (for time-based round end)
  if (showRoundSummary) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8">
            Round {currentRound} Complete!
          </h1>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-500/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">Team 1</h2>
              <div className="text-4xl font-bold">
                {getTeamScore('team1', currentRound)}
              </div>
              <p className="text-gray-400">cards this round</p>
            </div>
            <div className="bg-green-500/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-green-400 mb-4">Team 2</h2>
              <div className="text-4xl font-bold">
                {getTeamScore('team2', currentRound)}
              </div>
              <p className="text-gray-400">cards this round</p>
            </div>
          </div>

          <div className="text-xl text-gray-400">
            {currentRound < 3
              ? 'Preparing for next round...'
              : 'Game complete!'}
          </div>
        </div>
      </div>
    );
  }

  // Show game summary
  if (showGameSummary) {
    const winner = getWinner();
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8">Game Complete!</h1>

          <div className="bg-yellow-500/20 p-8 rounded-lg mb-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
              {winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-500/20 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-400 mb-4">Team 1</h3>
              <div className="text-3xl font-bold mb-2">
                {getTotalTeamScore('team1')}
              </div>
              <p className="text-gray-400">total points</p>
              <div className="mt-4 space-y-1">
                <div>Round 1: {getTeamScore('team1', 1)}</div>
                <div>Round 2: {getTeamScore('team1', 2)}</div>
                <div>Round 3: {getTeamScore('team1', 3)}</div>
              </div>
            </div>
            <div className="bg-green-500/20 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">Team 2</h3>
              <div className="text-3xl font-bold mb-2">
                {getTotalTeamScore('team2')}
              </div>
              <p className="text-gray-400">total points</p>
              <div className="mt-4 space-y-1">
                <div>Round 1: {getTeamScore('team2', 1)}</div>
                <div>Round 2: {getTeamScore('team2', 2)}</div>
                <div>Round 3: {getTeamScore('team2', 3)}</div>
              </div>
            </div>
          </div>

          {isHost ? (
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full"
              onClick={() => {
                // Clean up the room completely
                roomManager.updateGameState(roomId, 'finished');
                roomManager.deleteRoom(roomId);

                // Redirect all players to home
                window.location.href = '/';
              }}
            >
              End Game
            </button>
          ) : (
            <div className="text-xl text-gray-400 mb-4">
              Waiting for host to end the game...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{roundDescription}</h1>
          <div
            className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${
              currentTeam === 'team1'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500'
                : 'bg-green-500/20 text-green-400 border border-green-500'
            }`}
          >
            {currentTeam === 'team1' ? 'Team 1' : 'Team 2'}&apos;s Turn
          </div>
          <p className="text-gray-400 mt-2">
            Cards rotate within the team until time runs out
          </p>
        </div>

        {/* Start Round Button (for host) */}
        {!roundStarted && isHost && (
          <div className="text-center mb-8">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-xl"
              onClick={startRound}
            >
              Start Round
            </button>
          </div>
        )}

        {/* Waiting for host to start */}
        {!roundStarted && !isHost && (
          <div className="text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">
              Waiting for host to start the round...
            </p>
          </div>
        )}

        {/* Game Content */}
        {roundStarted && (
          <>
            {/* Timer - Only show for current player when turn has started */}
            {isMyTurn && turnStarted && (
              <div className="text-center mb-8">
                <div
                  className={`text-6xl font-mono font-bold ${
                    playerTimers[player.id] <= 10
                      ? 'text-red-500 animate-pulse'
                      : 'text-blue-500'
                  }`}
                >
                  {formatTime(playerTimers[player.id] || 0)}
                </div>
              </div>
            )}

            {/* Start Turn Button (for current player) */}
            {isMyTurn && !turnStarted && (
              <div className="text-center mb-8">
                <button
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-full text-xl"
                  onClick={startCurrentPlayerTurn}
                >
                  🎯 Start My Turn
                </button>
              </div>
            )}

            {/* Current Player Info */}
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  {isMyTurn ? 'Your Turn!' : `${currentPlayer?.name}'s Turn`}
                </h2>
                <p className="text-gray-400">
                  {currentPlayer?.team === 'team1' ? 'Team 1' : 'Team 2'} •{' '}
                  {currentPlayer?.name}
                </p>
              </div>
            </div>

            {/* Current Card - Only show for current player when turn has started */}
            {isMyTurn && turnStarted && (
              <>
                {currentCard ? (
                  <div className="bg-blue-500/20 border border-blue-500 p-8 rounded-lg mb-8">
                    <div className="text-center">
                      <h3 className="text-3xl font-bold mb-4">
                        {currentCard.text}
                      </h3>
                      <p className="text-xl mb-4">
                        {
                          (currentCard as unknown as { description?: string })
                            .description
                        }
                      </p>
                      <p className="text-yellow-400 text-lg mb-2">
                        Level{' '}
                        {(currentCard as unknown as { level?: number }).level ||
                          1}{' '}
                        (
                        {(currentCard as unknown as { level?: number }).level ||
                          1}{' '}
                        points)
                      </p>
                      <p className="text-gray-400">
                        Describe this word to your team!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/20 border border-yellow-500 p-8 rounded-lg mb-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-4">
                        Loading Card...
                      </h3>
                      <p className="text-gray-400">
                        Preparing your card for this turn...
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            {isMyTurn && turnStarted && currentCard && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
                  onClick={handleCorrectGuess}
                >
                  ✅ Correct!
                </button>
                <button
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
                  onClick={handleEndTurn}
                >
                  ⏹️ End Turn
                </button>
                <button
                  className={`font-bold py-4 px-6 rounded-lg text-lg ${
                    (playerSkipCounts[player.id] || 0) >= 2
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-700 text-white'
                  }`}
                  onClick={handleSkipCard}
                  disabled={(playerSkipCounts[player.id] || 0) >= 2}
                >
                  ⏭️ Skip ({playerSkipCounts[player.id] || 0}/2)
                </button>
              </div>
            )}
          </>
        )}

        {/* Current Round Progress */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-center text-white font-semibold text-xl mb-4">
            Round {currentRound} Progress
          </h3>
          <div className="text-center">
            {(() => {
              const totalCards = (room?.settings.cardsPerPlayer || 0) * 2; // Total cards for both teams
              const answeredCards =
                getTeamCardCount('team1', currentRound) +
                getTeamCardCount('team2', currentRound);
              const dots = [];

              for (let i = 0; i < totalCards; i++) {
                const isAnswered = i < answeredCards;
                dots.push(
                  <span
                    key={i}
                    className={`inline-block w-4 h-4 rounded-full mx-1 ${isAnswered ? 'bg-green-500' : 'bg-yellow-500'}`}
                  />
                );
              }

              return (
                <div className="flex justify-center items-center flex-wrap">
                  {dots}
                </div>
              );
            })()}
            <p className="text-sm text-gray-400 mt-2">
              {getTeamCardCount('team1', currentRound) +
                getTeamCardCount('team2', currentRound)}{' '}
              / {(room?.settings.cardsPerPlayer || 0) * 2} cards answered
            </p>
          </div>
        </div>

        {/* Team Scores - Only show when round ends and waiting for next round */}
        {showRoundSummary && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-500/20 p-6 rounded-lg">
              <h3 className="text-center text-blue-400 font-semibold text-xl mb-4">
                Team 1
              </h3>
              <div className="text-center">
                <span className="text-3xl font-bold text-blue-400">
                  {getTeamScore('team1', currentRound)}
                </span>
                <p className="text-sm text-gray-400">points</p>
                <p className="text-sm text-gray-400">
                  {getTeamCardCount('team1', currentRound)} cards answered
                </p>
              </div>
            </div>
            <div className="bg-green-500/20 p-6 rounded-lg">
              <h3 className="text-center text-green-400 font-semibold text-xl mb-4">
                Team 2
              </h3>
              <div className="text-center">
                <span className="text-3xl font-bold text-green-400">
                  {getTeamScore('team2', currentRound)}
                </span>
                <p className="text-sm text-gray-400">points</p>
                <p className="text-sm text-gray-400">
                  {getTeamCardCount('team2', currentRound)} cards answered
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Player List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {room.players.map((p, index) => (
            <div
              key={p.id}
              className={`p-4 rounded-lg border-2 ${
                index === currentPlayerIndex && roundStarted
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                <span
                  className={`text-sm ${
                    p.team === 'team1' ? 'text-blue-400' : 'text-green-400'
                  }`}
                >
                  {p.team === 'team1' ? 'Team 1' : 'Team 2'}
                </span>
              </div>
              {p.id === player.id && (
                <span className="text-xs text-blue-400">(You)</span>
              )}
            </div>
          ))}
        </div>

        {/* End Game Button (Host Only) */}
        {isHost && (
          <div className="text-center">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full"
              onClick={() => {
                // Clean up the room completely
                roomManager.updateGameState(roomId, 'finished');
                roomManager.deleteRoom(roomId);

                // Redirect all players to home
                window.location.href = '/';
              }}
            >
              End Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
