'use client';

import { useState, useEffect } from 'react';
import { roomManager, GameRoom } from '@/lib/roomManager';

export default function SetPage() {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load all rooms
  useEffect(() => {
    const loadRooms = () => {
      const allRooms = roomManager.getAllRooms();
      setRooms(allRooms);
    };

    loadRooms();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadRooms, 2000);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'monikers_rooms') {
        loadRooms();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteRoom = (roomId: string) => {
    roomManager.deleteRoom(roomId);
    setRefreshKey(prev => prev + 1);
  };

  const getTeamCount = (room: GameRoom, team: 'team1' | 'team2') => {
    return room.players.filter(p => p.team === team).length;
  };

  const getTeamPlayers = (room: GameRoom, team: 'team1' | 'team2') => {
    return room.players.filter(p => p.team === team);
  };

  const getGameStateColor = (state: string) => {
    switch (state) {
      case 'waiting': return 'text-yellow-400';
      case 'card-selection': return 'text-blue-400';
      case 'playing': return 'text-green-400';
      case 'finished': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getGameStateIcon = (state: string) => {
    switch (state) {
      case 'waiting': return '⏳';
      case 'card-selection': return '🎴';
      case 'playing': return '🎮';
      case 'finished': return '🏁';
      default: return '❓';
    }
  };

  const totalPlayers = rooms.reduce((sum, room) => sum + room.players.length, 0);
  const waitingRooms = rooms.filter(room => room.gameState === 'waiting').length;
  const playingRooms = rooms.filter(room => room.gameState === 'playing').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">System Monitor</h1>
            <p className="text-gray-400">Monitor all active sessions and teams</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            🔄 Refresh
          </button>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{rooms.length}</div>
            <div className="text-gray-400">Total Rooms</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{totalPlayers}</div>
            <div className="text-gray-400">Total Players</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{waitingRooms}</div>
            <div className="text-gray-400">Waiting Rooms</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{playingRooms}</div>
            <div className="text-gray-400">Active Games</div>
          </div>
        </div>

        {/* Rooms List */}
        <div className="space-y-6">
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h2 className="text-2xl font-bold mb-2">No Active Rooms</h2>
              <p className="text-gray-400">No rooms are currently active in the system.</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="bg-gray-800 rounded-lg p-6">
                {/* Room Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold">Room {room.id.toUpperCase()}</h2>
                      <span className={`text-lg ${getGameStateColor(room.gameState)}`}>
                        {getGameStateIcon(room.gameState)} {room.gameState}
                      </span>
                    </div>
                    <p className="text-gray-400">
                      Created by {room.players.find(p => p.isHost)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {room.players.length} / {room.settings.players} players
                    </span>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="bg-red-500 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Team Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Team 1 */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3">
                      Team 1 ({getTeamCount(room, 'team1')} players)
                    </h3>
                    <div className="space-y-2">
                      {getTeamPlayers(room, 'team1').map((player) => (
                        <div key={player.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">{player.name}</span>
                            {player.isHost && <span className="text-yellow-400 text-sm">👑</span>}
                            <span className="text-blue-400 text-sm">📱</span>
                          </div>
                          <span className="text-xs text-gray-500">{player.deviceType}</span>
                        </div>
                      ))}
                      {getTeamPlayers(room, 'team1').length === 0 && (
                        <p className="text-gray-500 text-sm">No players in Team 1</p>
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-400 mb-3">
                      Team 2 ({getTeamCount(room, 'team2')} players)
                    </h3>
                    <div className="space-y-2">
                      {getTeamPlayers(room, 'team2').map((player) => (
                        <div key={player.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">{player.name}</span>
                            {player.isHost && <span className="text-yellow-400 text-sm">👑</span>}
                            <span className="text-green-400 text-sm">📱</span>
                          </div>
                          <span className="text-xs text-gray-500">{player.deviceType}</span>
                        </div>
                      ))}
                      {getTeamPlayers(room, 'team2').length === 0 && (
                        <p className="text-gray-500 text-sm">No players in Team 2</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">Settings</div>
                    <div className="font-semibold">
                      {room.settings.players} players, {room.settings.cardsPerPlayer} cards each
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">Created</div>
                    <div className="font-semibold">
                      {new Date(room.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">Last Updated</div>
                    <div className="font-semibold">
                      {new Date(room.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>System Monitor - Real-time session tracking</p>
          <p className="text-sm mt-2">Auto-refreshes every 2 seconds</p>
        </div>
      </div>
    </div>
  );
}
