import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserAvatar from '@/components/ui/UserAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Crown, Circle, Medal, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chess');
  const [leaderboard, setLeaderboard] = useState({ chess: [], checkers: [] });
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        setUser(await base44.auth.me());
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [user?.id]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const [chessStats, checkersStats] = await Promise.all([
        base44.entities.PlayerStats.list('-chess_rating', 50),
        base44.entities.PlayerStats.list('-checkers_rating', 50)
      ]);

      const mapStats = (stats, ratingField, emoji) =>
        (stats || []).map((s, idx) => ({
          rank: idx + 1,
          name: s.username || 'Joueur',
          rating: s[ratingField] || 1200,
          games_won: s.games_won || 0,
          avatar: s.avatar || emoji
        }));

      const chess = mapStats(chessStats, 'chess_rating', '♔');
      const checkers = mapStats(checkersStats, 'checkers_rating', '⚫');
      setLeaderboard({ chess, checkers });

      if (user?.id) {
        const me = await base44.entities.PlayerStats.filter({ user_id: user.id });
        const stats = me?.[0] || null;
        if (stats) {
          const chessRank = chessStats?.findIndex(s => s.user_id === user.id);
          setUserStats({ ...stats, rank: chessRank >= 0 ? chessRank + 1 : null });
        } else {
          setUserStats(null);
        }
      } else {
        setUserStats(null);
      }
    } catch (e) {
      console.log('Erreur chargement classement:', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
      case 3: return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default: return 'bg-white/10 text-white';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Medal className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold">{rank}</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Classement</h1>
          <p className="text-sm text-gray-400">Les meilleurs joueurs</p>
        </div>
      </div>

      {/* User Rank Banner */}
       {user && (
         <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 mb-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <UserAvatar 
                 user={user}
                 size="default"
                 className="border-2 border-amber-500/50"
               />
              <div>
                <p className="text-sm text-gray-400">Votre classement</p>
                <p className="font-bold text-white">{user.full_name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-amber-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold">
                  {userStats ? `#${userStats.rank || '-'}` : '--'}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {userStats?.chess_rating || user.chess_rating || 1200} pts
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 mb-4">
          <TabsTrigger value="chess" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Crown className="w-4 h-4 mr-2" />
            Échecs
          </TabsTrigger>
          <TabsTrigger value="checkers" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Circle className="w-4 h-4 mr-2" />
            Dames
          </TabsTrigger>
        </TabsList>

        {Object.entries(leaderboard).map(([type, players]) => (
          <TabsContent key={type} value={type}>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Chargement...</div>
            ) : players.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Aucun classement disponible</div>
            ) : (
            <div className="space-y-3">
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {players.slice(0, 3).map((player, index) => {
                  const order = [1, 0, 2][index];
                  const heights = ['h-24', 'h-32', 'h-20'];
                  return (
                    <div 
                      key={player.rank} 
                      className={`order-${order + 1} flex flex-col items-center`}
                      style={{ order: order }}
                    >
                      <div className="text-3xl mb-2">{player.avatar}</div>
                      <div className={`w-full ${heights[index]} rounded-t-xl flex flex-col items-center justify-end pb-3 ${getRankStyle(player.rank)}`}>
                        <span className="text-2xl font-bold mb-1">{player.rank}</span>
                        <span className="text-xs truncate w-full text-center px-1">{player.name}</span>
                        <span className="text-xs opacity-80">{player.rating}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rest of leaderboard */}
              {players.slice(3).map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      {getRankIcon(player.rank)}
                    </div>
                    <div className="flex items-center gap-3">
                       <Avatar className="w-8 h-8 border border-white/20">
                         <AvatarImage src={player.avatar_url} />
                         <AvatarFallback className="bg-[#8B5A2B] text-white text-xs">
                           {player.name?.charAt(0) || '?'}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <h3 className="font-semibold text-white">{player.name}</h3>
                         <p className="text-sm text-gray-400">{player.games_won} victoires</p>
                       </div>
                     </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">{player.rating}</div>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}