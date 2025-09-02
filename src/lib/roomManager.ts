import { v4 as uuidv4 } from 'uuid';

// update to supabase

// Import Card type from GameScreen
export interface Card {
  id: string;
  text: string;
  round: number;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  deviceType: 'desktop' | 'mobile';
  team?: 'team1' | 'team2';
  selectedCards?: Card[]; // Added for card selection
}

export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  gameState: 'waiting' | 'card-selection' | 'playing' | 'finished';
  settings: {
    players: number;
    cardsPerPlayer: number;
  };
  currentRound: number;
  scores: Record<string, Record<number, Card[]>>;
  currentPlayerIndex: number; // Added for player management
  createdAt: number; // Added for creation timestamp
  updatedAt: number; // Added for cleanup
  // Game state properties
  currentTeam?: 'team1' | 'team2';
  timer?: number;
  isRoundActive?: boolean;
  roundStarted?: boolean;
  usedCards?: string[];
  currentCard?: Card | null;
  playerTimers?: Record<string, number>; // Added for individual player timers
  playerSkipCounts?: Record<string, number>; // Added for individual player skip counts
  turnStarted?: boolean; // Added for turn started status
}

class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private readonly STORAGE_KEY = 'monikers_rooms';

  constructor() {
    this.loadRoomsFromStorage();
  }

  private loadRoomsFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const roomsData = JSON.parse(stored);
        this.rooms = new Map(Object.entries(roomsData));
      }
    } catch {
      // Error loading rooms from storage
    }
  }

  private saveRoomsToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const roomsData = Object.fromEntries(this.rooms);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roomsData));
    } catch {
      // Error saving rooms to storage
    }
  }

  private assignTeam(room: GameRoom): 'team1' | 'team2' {
    const team1Count = room.players.filter((p) => p.team === 'team1').length;
    const team2Count = room.players.filter((p) => p.team === 'team2').length;

    // Assign to the team with fewer players
    return team1Count <= team2Count ? 'team1' : 'team2';
  }

  createRoom(hostName: string): GameRoom {
    const roomId = uuidv4().substring(0, 8);
    const hostId = uuidv4();

    const room: GameRoom = {
      id: roomId,
      hostId,
      players: [
        {
          id: hostId,
          name: hostName,
          isHost: true,
          deviceType: 'desktop',
          team: 'team1', // Host is always team1
        },
      ],
      gameState: 'waiting',
      settings: {
        players: 4,
        cardsPerPlayer: 5,
      },
      currentRound: 1,
      scores: {
        team1: {},
        team2: {},
      },
      currentPlayerIndex: 0, // Initialize
      createdAt: Date.now(), // Initialize creation timestamp
      updatedAt: Date.now(), // Initialize
    };

    this.rooms.set(roomId, room);
    this.saveRoomsToStorage();
    return room;
  }

  getRoom(roomId: string): GameRoom | null {
    this.loadRoomsFromStorage();
    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): GameRoom[] {
    this.loadRoomsFromStorage();
    return Array.from(this.rooms.values());
  }

  joinRoom(
    roomId: string,
    playerName: string,
    deviceType: 'desktop' | 'mobile'
  ): Player | null {
    // Reload from storage to get latest data
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room || room.gameState !== 'waiting') {
      return null;
    }

    // Check if room is full
    if (room.players.length >= room.settings.players) {
      return null;
    }

    // Check if name is already taken
    const nameExists = room.players.some(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (nameExists) {
      return null;
    }

    const playerId = uuidv4();

    const player: Player = {
      id: playerId,
      name: playerName,
      isHost: false,
      deviceType,
      // Team will be assigned later when player chooses
    };

    room.players.push(player);
    this.saveRoomsToStorage();
    return player;
  }

  leaveRoom(roomId: string, playerId: string): boolean {
    // Reload from storage to get latest data
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.players = room.players.filter((p) => p.id !== playerId);

    // If host leaves, assign new host or delete room
    if (room.hostId === playerId) {
      if (room.players.length > 0) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
        room.players[0].team = 'team1'; // New host becomes team1
      } else {
        this.rooms.delete(roomId);
      }
    }

    this.saveRoomsToStorage();
    return true;
  }

  updateGameState(roomId: string, gameState: GameRoom['gameState']): boolean {
    // Reload from storage to get latest data
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.gameState = gameState;
    this.saveRoomsToStorage();
    return true;
  }

  updateSettings(
    roomId: string,
    settings: Partial<{ players: number; cardsPerPlayer: number }>
  ): boolean {
    // Reload from storage to get latest data
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.settings = { ...room.settings, ...settings };
    this.saveRoomsToStorage();
    return true;
  }

  assignTeamToPlayer(
    roomId: string,
    playerId: string,
    team: 'team1' | 'team2'
  ): boolean {
    // Reload from storage to get latest data
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return false;

    // Check team balance before assigning
    const team1Count = room.players.filter((p) => p.team === 'team1').length;
    const team2Count = room.players.filter((p) => p.team === 'team2').length;
    const totalPlayers = room.players.length;
    const maxTeamSize = Math.ceil(totalPlayers / 2);

    // If the requested team is already at max capacity, return false
    if (team === 'team1' && team1Count >= maxTeamSize) return false;
    if (team === 'team2' && team2Count >= maxTeamSize) return false;

    player.team = team;
    this.saveRoomsToStorage();
    return true;
  }

  // Check if a team is available for joining
  isTeamAvailable(roomId: string, team: 'team1' | 'team2'): boolean {
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    const team1Count = room.players.filter((p) => p.team === 'team1').length;
    const team2Count = room.players.filter((p) => p.team === 'team2').length;
    const totalPlayers = room.players.length;
    const maxTeamSize = Math.ceil(totalPlayers / 2);

    if (team === 'team1') return team1Count < maxTeamSize;
    if (team === 'team2') return team2Count < maxTeamSize;

    return false;
  }

  // Get available teams for a room
  getAvailableTeams(roomId: string): ('team1' | 'team2')[] {
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return [];

    const team1Count = room.players.filter((p) => p.team === 'team1').length;
    const team2Count = room.players.filter((p) => p.team === 'team2').length;
    const totalPlayers = room.players.length;
    const maxTeamSize = Math.ceil(totalPlayers / 2);

    const availableTeams: ('team1' | 'team2')[] = [];

    if (team1Count < maxTeamSize) availableTeams.push('team1');
    if (team2Count < maxTeamSize) availableTeams.push('team2');

    return availableTeams;
  }

  // Update player's selected cards
  updatePlayerCards(roomId: string, playerId: string, cards: Card[]): boolean {
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.selectedCards = cards;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Update current player index
  updateCurrentPlayer(roomId: string, playerIndex: number): boolean {
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.currentPlayerIndex = playerIndex;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Get all cards selected by all players
  getAllSelectedCards(roomId: string): Card[] {
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return [];

    const allCards: Card[] = [];
    room.players.forEach((player) => {
      if (player.selectedCards) {
        allCards.push(...player.selectedCards);
      }
    });

    return allCards;
  }

  // Update scores for a room
  updateScores(
    roomId: string,
    scores: Record<string, Record<number, Card[]>>
  ): boolean {
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.scores = scores;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Update current round
  updateCurrentRound(roomId: string, round: number): boolean {
    this.loadRoomsFromStorage();

    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.currentRound = round;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Additional game state update methods
  updateCurrentTeam(roomId: string, team: 'team1' | 'team2'): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.currentTeam = team;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  updateTimer(roomId: string, timer: number): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.timer = timer;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  updateRoundStatus(
    roomId: string,
    isRoundActive: boolean,
    roundStarted: boolean
  ): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.isRoundActive = isRoundActive;
    room.roundStarted = roundStarted;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  updateUsedCards(roomId: string, usedCards: string[]): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.usedCards = usedCards;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Update current card
  updateCurrentCard(roomId: string, currentCard: Card | null): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.currentCard = currentCard;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Update individual player timer
  updatePlayerTimer(roomId: string, playerId: string, timer: number): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (!room.playerTimers) room.playerTimers = {};
    room.playerTimers[playerId] = timer;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Update player skip count
  updatePlayerSkipCount(
    roomId: string,
    playerId: string,
    skipCount: number
  ): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (!room.playerSkipCounts) room.playerSkipCounts = {};
    room.playerSkipCounts[playerId] = skipCount;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Update turn started status
  updateTurnStarted(roomId: string, turnStarted: boolean): boolean {
    this.loadRoomsFromStorage();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.turnStarted = turnStarted;
    room.updatedAt = Date.now();
    this.saveRoomsToStorage();
    return true;
  }

  // Delete a room completely
  deleteRoom(roomId: string): boolean {
    this.loadRoomsFromStorage();
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      this.saveRoomsToStorage();
    }
    return deleted;
  }

  // Clean up old rooms (older than 1 hour)
  cleanupOldRooms() {
    // For now, we'll keep all rooms since we don't have timestamps
    // In a real implementation, you'd add timestamps and clean up old rooms
  }
}

export const roomManager = new RoomManager();
