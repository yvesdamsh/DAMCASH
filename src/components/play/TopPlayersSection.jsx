import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import UserAvatar from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { Medal, Crown } from 'lucide-react';

export default function TopPlayersSection({ gameType }) {
  const [topPlayers, setTopPlayers] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Mock data for now - in real app, fetch from leaderboard
      const mockPlayers = [
        { id: 1, full_name: 'AlexMaster', elo: 2847, rank: 1, badge: '👑' },
        { id: 2, full_name: 'ChessNinja', elo: 2756, rank: 2, badge: '🥈' },
        { id: 3, full_name: 'StrategyKing', elo: 2634, rank: 3, badge: '🥉' },
        { id: 4, full_name: 'TacticalGamer', elo: 2521, rank: 4, badge: '' },
        { id: 5, full_name: 'ProPlayer', elo: 2398, rank: 5, badge: '' }
      ];

      setTopPlayers(mockPlayers);

      // Find user's rank
      if (user) {
        const userRankMock = { rank: 145, elo: 1650 };
        setUserRank(userRankMock);
      }
    } catch (e) {
      console.log('Failed to load players');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main leaderboard */}
      <div className="lg:col-span-2">
        <h2 className="text-3xl md:text-4xl font-black text-[#F5E6D3] mb-2">
          🏆 Classement en direct
        </h2>
        <p className="text-[#D4A574] mb-6">Les meilleurs joueurs du moment</p>

        <div className="space-y-3">
          {topPlayers.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ x: 8 }}
              className="relative group"
            >
              <div className="bg-white/5 border border-white/10 hover:border-[#D4A574]/50 rounded-2xl p-4 transition-all hover:bg-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  {/* Rank and player info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5A2B] flex items-center justify-center font-bold text-[#2C1810]">
                      {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : player.rank}
                    </div>

                    <UserAvatar user={player} size="sm" />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#F5E6D3] text-sm truncate">{player.full_name}</p>
                      <p className="text-[#D4A574] text-xs">Rang #{player.rank}</p>
                    </div>
                  </div>

                  {/* ELO */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                    className="text-right"
                  >
                    <div className="text-2xl font-black text-[#D4A574]">{player.elo}</div>
                    <p className="text-[#D4A574] text-xs">ELO</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View full leaderboard button */}
        <Link to={createPageUrl('Leaderboard')} className="mt-6 block">
          <Button className="w-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] font-bold text-lg py-6 hover:shadow-lg hover:shadow-amber-500/50 transition-all">
            Voir le classement complet →
          </Button>
        </Link>
      </div>

      {/* User's rank card */}
      {currentUser && userRank && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sticky top-20 h-fit"
        >
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl border-2 border-white/20 p-6 backdrop-blur-sm shadow-xl">
            <div className="text-center">
              <p className="text-white/80 text-sm mb-2">Ton classement</p>
              <div className="text-5xl font-black text-white mb-4">#{userRank.rank}</div>
              
              <UserAvatar user={currentUser} size="xl" className="mx-auto mb-4" />
              
              <p className="text-2xl font-bold text-white mb-2">{currentUser.full_name}</p>
              <p className="text-white/80 mb-6">
                <span className="text-3xl font-black text-yellow-300">{userRank.elo}</span> ELO
              </p>

              <div className="space-y-2 text-sm text-white/80">
                <p>📈 +45 ELO cette semaine</p>
                <p>🎮 12 parties jouées</p>
                <p>✅ 8 victoires</p>
              </div>

              <Button className="w-full mt-6 bg-white text-purple-600 font-bold hover:bg-white/90">
                Voir mes stats →
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}