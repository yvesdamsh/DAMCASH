import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Crown, Circle, Users, Clock, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Spectate() {
  const navigate = useNavigate();
  const { data: matches = [] } = useQuery({
    queryKey: ['liveMatches'],
    queryFn: () => base44.entities.GameSession.filter({ status: 'in_progress' }),
    refetchInterval: 15000
  });
  const { data: statsList = [] } = useQuery({
    queryKey: ['playerStats'],
    queryFn: () => base44.entities.PlayerStats.list(),
    refetchInterval: 60000
  });

  const statsMap = (statsList || []).reduce((acc, s) => {
    acc[s.user_id] = s;
    return acc;
  }, {});

  const displayGames = matches.map((m) => ({
    id: m.id,
    room_id: m.room_id,
    game_type: m.game_type,
    player_white_name: m.player1_name || 'Joueur',
    player_black_name: m.player2_name || m.invited_player_name || 'Joueur',
    rating_white: statsMap[m.player1_id]?.[m.game_type === 'chess' ? 'chess_rating' : 'checkers_rating'],
    rating_black: statsMap[m.player2_id]?.[m.game_type === 'chess' ? 'chess_rating' : 'checkers_rating'],
    time_control: m.time_control || 'blitz',
    spectators_count: m.spectators_count || 0,
    move_count: m.move_count || 0,
    featured: !!m.ranked
  }));

  const handleSpectate = (roomId) => {
    if (!roomId) return;
    navigate(`/GameRoom?roomId=${roomId}&spectate=true`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mode Spectateur</h1>
          <p className="text-sm text-gray-400">{displayGames.length} parties en cours</p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm text-red-400">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span>EN DIRECT</span>
      </div>

      {displayGames.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          Aucune partie en cours
        </div>
      )}

      {/* Featured Games */}
      {displayGames.filter(g => g.featured).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Parties à la une
          </h2>
          <div className="space-y-4">
            {displayGames.filter(g => g.featured).map((game) => (
              <div
                key={game.id}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {game.game_type === 'chess' ? (
                      <Crown className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-blue-400" />
                    )}
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      {game.game_type === 'chess' ? 'Échecs' : 'Dames'}
                    </Badge>
                    <Badge className="bg-white/10 text-white border-white/20 capitalize">
                      {game.time_control}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-purple-400">
                    <Eye className="w-4 h-4" />
                    <span>{game.spectators_count}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <p className="font-bold text-white">{game.player_white_name}</p>
                    <p className="text-sm text-gray-400">⚪ {game.rating_white}</p>
                  </div>
                  <div className="px-4 text-gray-500 font-bold">VS</div>
                  <div className="text-center flex-1">
                    <p className="font-bold text-white">{game.player_black_name}</p>
                    <p className="text-sm text-gray-400">⚫ {game.rating_black}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{game.move_count} coups</span>
                  </div>
                  <Button
                    onClick={() => handleSpectate(game.room_id)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Regarder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Games */}
      <h2 className="text-lg font-semibold text-white mb-3">Toutes les parties</h2>
      <div className="space-y-3">
        {displayGames.filter(g => !g.featured).map((game) => (
          <div
            key={game.id}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  game.game_type === 'chess' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                }`}>
                  {game.game_type === 'chess' ? (
                    <Crown className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {game.player_white_name} vs {game.player_black_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Badge variant="outline" className="text-xs capitalize border-white/20">
                      {game.time_control}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {game.spectators_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {game.move_count} coups
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSpectate(game.room_id)}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}