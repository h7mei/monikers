'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Card {
  level: number;
  word: string;
  description: string;
}

export type ScoresByRound = Record<string, Record<number, Card[]>>;

interface Props {
  initialCards: Card[];
  onGameEnd: (scores: ScoresByRound) => void;
  onRoundEnd: (scores: ScoresByRound) => void;
  round: number;
  scores: ScoresByRound;
}

const ROUND_DURATION = 60;

export default function GameScreen({
  initialCards,
  onGameEnd,
  onRoundEnd,
  round,
  scores: initialScores,
}: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [guessedCards, setGuessedCards] = useState<Card[]>([]);
  const cardsRef = useRef<Card[]>([]);
  const guessedCardsRef = useRef<Card[]>([]);
  const [scores, setScores] = useState<ScoresByRound>(initialScores);
  const [currentTeam, setCurrentTeam] = useState('team1');
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [canSkip, setCanSkip] = useState(true);
  const [isGuessButtonDisabled, setIsGuessButtonDisabled] = useState(false);
  const sounds = useRef<{
    bell: HTMLAudioElement;
    ring: HTMLAudioElement;
  } | null>(null);

  const roundDescription = `Round ${round}: ${
    round === 1 ? 'Free Talking' : round === 2 ? 'One Word' : 'Expressions'
  }`;

  useEffect(() => {
    // Initialize sounds
    sounds.current = {
      bell: new Audio('/sounds/bell.wav'),
      ring: new Audio('/sounds/ring.wav'),
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    guessedCardsRef.current = guessedCards;
  }, [guessedCards]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      const shouldLeave = window.confirm(
        'Are you sure you want to leave the game?'
      );
      if (!shouldLeave) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    setCards([...initialCards].sort(() => 0.5 - Math.random()));
  }, [initialCards]);

  const endRound = useCallback(
    ({
      remainingCards = [],
      updatedGuessedCards = [],
    }: {
      remainingCards?: Card[];
      updatedGuessedCards?: Card[];
    }) => {
      setIsRoundActive(false);
      sounds.current?.ring.play();
      const newScores: ScoresByRound = {
        ...scores,
        [currentTeam]: {
          ...scores[currentTeam],
          [round]: [
            ...(scores[currentTeam][round] || []),
            ...updatedGuessedCards,
          ],
        },
      };
      setScores(newScores);
      setGuessedCards([]);
      if (remainingCards.length === 0) {
        if (round < 3) {
          onRoundEnd(newScores);
        } else {
          onGameEnd(newScores);
        }
      } else {
        setCurrentTeam(currentTeam === 'team1' ? 'team2' : 'team1');
      }
    },
    [currentTeam, onGameEnd, scores, round, onRoundEnd]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRoundActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isRoundActive && timer === 0) {
      const currentCards = cardsRef.current;
      const currentGuessedCards = guessedCardsRef.current;
      const [currentCard, ...remainingCards] = currentCards;
      const nextRoundCards = [...remainingCards, currentCard];
      setCards(nextRoundCards);
      endRound({
        remainingCards: nextRoundCards,
        updatedGuessedCards: currentGuessedCards,
      });
    }
    return () => clearInterval(interval);
  }, [isRoundActive, timer, endRound]);

  const startRound = () => {
    if (sounds.current?.ring) {
      sounds.current.ring.pause();
      sounds.current.ring.currentTime = 0;
    }
    setIsRoundActive(true);
    setTimer(ROUND_DURATION);
    setCanSkip(true);
  };

  const handleGuess = () => {
    if (!isRoundActive || cards.length === 0 || isGuessButtonDisabled) return;

    setIsGuessButtonDisabled(true);
    if (sounds.current?.bell) {
      sounds.current.bell.pause();
      sounds.current.bell.currentTime = 0;
      sounds.current.bell.play();
    }

    const [currentCard, ...remainingCards] = cards;
    const updatedGuessedCards = [...guessedCards, currentCard];

    setGuessedCards(updatedGuessedCards);
    setCards(remainingCards);
    setCanSkip(true);

    // Re-enable the button after 1 second
    setTimeout(() => {
      setIsGuessButtonDisabled(false);
    }, 1000);

    if (remainingCards.length === 0) {
      endRound({
        remainingCards,
        updatedGuessedCards,
      });
    }
  };

  const handleSkip = () => {
    if (!isRoundActive || !canSkip || cards.length <= 1) return;
    setCanSkip(false);
    const [currentCard, ...remainingCards] = cards;
    setCards([...remainingCards, currentCard]); // Move to the back of the deck
  };

  const handleEndRound = () => {
    if (!isRoundActive) return;
    endRound({
      remainingCards: cards,
      updatedGuessedCards: guessedCards,
    });
  };

  const activeCard = cards[0];

  if (!isRoundActive) {
    return (
      <div className="flex flex-col items-center justify-center h-svh">
        <h2 className="text-2xl font-bold mb-2">{roundDescription}</h2>
        <h1 className="text-4xl font-bold mb-8">
          Team {currentTeam === 'team1' ? 1 : 2}&apos;s Turn
        </h1>
        <button
          onClick={startRound}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-2xl cursor-pointer shadow-xl shadow-blue-500/20"
        >
          Start Round
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-svh p-6">
      <div className="text-4xl font-bold mb-4">{timer}</div>
      {activeCard && (
        <div className="p-8 rounded-lg shadow-lg text-center mb-8 border border-gray-100">
          <h2 className="text-3xl font-bold mb-2">{activeCard.word}</h2>
          <p className="text-xl">{activeCard.description}</p>
        </div>
      )}
      <div className="w-full sm:w-3xl flex justify-between">
        <button
          onClick={handleSkip}
          disabled={!canSkip}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full disabled:opacity-50"
        >
          Skip
        </button>
        <button
          onClick={handleGuess}
          disabled={isGuessButtonDisabled}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-xl shadow-green-500/20 disabled:opacity-50"
        >
          Guessed
        </button>
      </div>
      <div className="fixed bottom-12 flex justify-center w-full">
        <button
          onClick={handleEndRound}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
        >
          End Round
        </button>
      </div>
      {!canSkip && (
        <p className="text-sm text-gray-500 mt-4">
          Skip again after guessing a word correctly.
        </p>
      )}
    </div>
  );
}
