'use client';

import { useState, useEffect, useCallback } from 'react';
import { roomManager, GameRoom, Player } from '@/lib/roomManager';
import { useRoomChannel } from '@/hooks/useRoomChannel';

interface Props {
  params: Promise<{
    roomId: string;
  }>;
  searchParams: Promise<{
    playerName?: string;
  }>;
}

export default function TeamSelectionPage({ params, searchParams }: Props) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | null>(
    null
  );
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{
    roomId: string;
    playerName?: string;
  } | null>(null);

  // Resolve async params
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const [resolvedParams, resolvedSearchParams] = await Promise.all([
          params,
          searchParams,
        ]);

        setResolvedParams({
          roomId: resolvedParams.roomId,
          playerName: resolvedSearchParams.playerName,
        });

        setPlayerName(resolvedSearchParams.playerName || '');
      } catch {
        // Error resolving params
      }
    };

    resolveParams();
  }, [params, searchParams]);

  // Load room data
  useEffect(() => {
    if (!resolvedParams) return;

    const roomData = roomManager.getRoom(resolvedParams.roomId);
    if (roomData) {
      setRoom(roomData);
    } else {
      setError('Room not found');
    }
  }, [resolvedParams]);

  const handleRealtimeUpdate = useCallback(() => {
    if (!resolvedParams) return;
    const updatedRoom = roomManager.getRoom(resolvedParams.roomId);
    if (updatedRoom) setRoom(updatedRoom);
  }, [resolvedParams]);

  useRoomChannel(resolvedParams?.roomId, handleRealtimeUpdate, () => {
    setError('Room was deleted');
  }, handleRealtimeUpdate);

  const handleJoinTeam = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }

    if (!room || !resolvedParams) {
      setError('Room not found');
      return;
    }

    // Check if room is full
    if (room.players.length >= room.settings.players) {
      setError('Room is full');
      return;
    }

    // Check if name is already taken
    const nameExists = room.players.some(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (nameExists) {
      setError('Name already taken');
      return;
    }

    setIsJoining(true);
    setError('');

    // Join room first
    const player = roomManager.joinRoom(
      resolvedParams.roomId,
      playerName,
      'mobile'
    );
    if (player) {
      // Then assign the team
      const success = roomManager.assignTeamToPlayer(
        resolvedParams.roomId,
        player.id,
        selectedTeam
      );
      if (success) {
        player.team = selectedTeam;
        setPlayer(player);
      } else {
        setError('Failed to assign team');
        setIsJoining(false);
      }
    } else {
      setError('Failed to join room');
      setIsJoining(false);
    }
  };

  const getTeamCount = (team: 'team1' | 'team2') => {
    return room?.players.filter((p) => p.team === team).length || 0;
  };

  const getTeamPlayers = (team: 'team1' | 'team2') => {
    return room?.players.filter((p) => p.team === team) || [];
  };

  const isTeamAvailable = (team: 'team1' | 'team2') => {
    if (!room) return false;
    return roomManager.isTeamAvailable(room.id, team);
  };

  const getMaxTeamSize = () => {
    if (!room) return 0;
    return Math.ceil(room.players.length / 2);
  };

  const getTeamStatus = (team: 'team1' | 'team2') => {
    if (!room) return 'unavailable';
    const count = getTeamCount(team);
    const maxSize = getMaxTeamSize();

    if (count >= maxSize) return 'full';
    if (count === maxSize - 1) return 'almost-full';
    return 'available';
  };

  if (player && room) {
    // Redirect to waiting screen
    const waitingUrl = `/join/${resolvedParams?.roomId}/waiting?playerId=${player.id}`;
    window.location.href = waitingUrl;
    return null;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-gray-400">
            The room you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Your Team</h1>
          <p className="text-gray-400">
            Room: {resolvedParams?.roomId.toUpperCase()}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-50 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName || ''}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Team Selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-center">
            Select Your Team
          </h2>

          {/* Team 1 */}
          <div
            className={`p-4 rounded-lg border-2 transition-colors ${!isTeamAvailable('team1')
              ? 'border-gray-600 bg-gray-700 cursor-not-allowed opacity-50'
              : selectedTeam === 'team1'
                ? 'border-blue-500 bg-blue-500/20 cursor-pointer'
                : 'border-gray-700 bg-gray-800 hover:border-blue-400 cursor-pointer'
              }`}
            onClick={() => isTeamAvailable('team1') && setSelectedTeam('team1')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-400">Team 1</h3>
                <p className="text-sm text-gray-400">
                  {getTeamCount('team1')} / {getMaxTeamSize()} players
                </p>
                {getTeamStatus('team1') === 'full' && (
                  <p className="text-sm text-red-400">Team Full</p>
                )}
                {getTeamStatus('team1') === 'almost-full' && (
                  <p className="text-sm text-yellow-400">Almost Full</p>
                )}
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {getTeamCount('team1')}
              </div>
            </div>

            {/* Team 1 Players */}
            {getTeamPlayers('team1').length > 0 && (
              <div className="mt-2 space-y-1">
                {getTeamPlayers('team1').map((player) => (
                  <div key={player.id} className="text-sm text-gray-300">
                    • {player.name} {player.isHost && '(Host)'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div
            className={`p-4 rounded-lg border-2 transition-colors ${!isTeamAvailable('team2')
              ? 'border-gray-600 bg-gray-700 cursor-not-allowed opacity-50'
              : selectedTeam === 'team2'
                ? 'border-green-500 bg-green-500/20 cursor-pointer'
                : 'border-gray-700 bg-gray-800 hover:border-green-400 cursor-pointer'
              }`}
            onClick={() => isTeamAvailable('team2') && setSelectedTeam('team2')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-400">Team 2</h3>
                <p className="text-sm text-gray-400">
                  {getTeamCount('team2')} / {getMaxTeamSize()} players
                </p>
                {getTeamStatus('team2') === 'full' && (
                  <p className="text-sm text-red-400">Team Full</p>
                )}
                {getTeamStatus('team2') === 'almost-full' && (
                  <p className="text-sm text-yellow-400">Almost Full</p>
                )}
              </div>
              <div className="text-2xl font-bold text-green-400">
                {getTeamCount('team2')}
              </div>
            </div>

            {/* Team 2 Players */}
            {getTeamPlayers('team2').length > 0 && (
              <div className="mt-2 space-y-1">
                {getTeamPlayers('team2').map((player) => (
                  <div key={player.id} className="text-sm text-gray-300">
                    • {player.name} {player.isHost && '(Host)'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleJoinTeam}
          disabled={isJoining || !selectedTeam || !playerName.trim()}
        >
          {isJoining ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Joining...
            </div>
          ) : (
            `Join ${selectedTeam === 'team1' ? 'Team 1' : selectedTeam === 'team2' ? 'Team 2' : 'Team'}`
          )}
        </button>

        <div className="text-center text-sm text-gray-500">
          <p>
            Room Capacity: {room.players.length} / {room.settings.players}
          </p>
        </div>
      </div>
    </div>
  );
}
