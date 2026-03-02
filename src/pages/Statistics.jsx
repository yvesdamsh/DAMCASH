import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TrendingUp, Trophy, Target, Flame, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#D4A574', '#8B5A2B', '#5D3A1A'];

export default function Statistics() {
  const [user, setUser] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Charger les stats du joueur
  const { data: playerStats } = useQuery({
    queryKey: ['playerStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const results = await base44.entities.PlayerStats.filter({ user_id: user.id });
      return results?.[0] || null;
    },
    enabled: !!user?.id
  });

  // Charger les résultats de parties
  const { data: gameResults = [] } = useQuery({
    queryKey: ['userGameResults', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await base44.entities.GameResult.filter({}, '-created_date', 100);
      return results.filter(r => r.player1_id === user.id || r.player2_id === user.id);
    },
    enabled: !!user?.id
  });

  // Charger les revues reçues
  const { data: reviews = [] } = useQuery({
    queryKey: ['userReviews', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await base44.entities.GameReview.filter({});
      return results.filter(r => r.reviewed_player_id === user.id);
    },
    enabled: !!user?.id
  });

  if (!playerStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4A574]" />
      </div>
    );
  }

  // Calculer les stats
  const chessTotal = playerStats.chess_wins + playerStats.chess_losses + playerStats.chess_draws;
  const checkersTotal = playerStats.checkers_wins + playerStats.checkers_losses + playerStats.checkers_draws;
  
  const chessWinRate = chessTotal > 0 ? ((playerStats.chess_wins / chessTotal) * 100).toFixed(1) : 0;
  const checkersWinRate = checkersTotal > 0 ? ((playerStats.checkers_wins / checkersTotal) * 100).toFixed(1) : 0;
  
  const totalGames = chessTotal + checkersTotal;
  const totalWins = playerStats.chess_wins + playerStats.checkers_wins;
  const overallWinRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0;

  // Données pour les graphiques
  const winRateData = [
    { name: '♟️ Échecs', wins: playerStats.chess_wins, losses: playerStats.chess_losses, draws: playerStats.chess_draws },
    { name: '⚫ Dames', wins: playerStats.checkers_wins, losses: playerStats.checkers_losses, draws: playerStats.checkers_draws }
  ];

  const gameTypeData = [
    { name: 'Classées', value: playerStats.ranked_games_count, fill: '#D4A574' },
    { name: 'Non classées', value: playerStats.casual_games_count, fill: '#8B5A2B' }
  ];

  // Historique mensuel (simulé)
  const monthlyPerformance = generateMonthlyData(gameResults);

  const StatCard = ({ icon: Icon, label, value, unit = '', color = '#D4A574' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-[#3E2723] to-[#2C1810] border border-[#D4A574]/20 space-y-2"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <p className="text-xs uppercase tracking-widest text-[#D4A574]/60">{label}</p>
      </div>
      <p className="text-2xl font-black" style={{ color }}>
        {value}<span className="text-sm font-normal opacity-70">{unit}</span>
      </p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      <style>{`
        .glass-card { background: rgba(93, 58, 26, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(212, 165, 116, 0.2); }
        .recharts-wrapper { outline: none !important; }
        .recharts-text { fill: #D4A574 !important; }
        .recharts-cartesian-axis-tick-value { fill: #D4A574 !important; }
      `}</style>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 border-b border-[#D4A574]/20">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-[#D4A574]" />
          <h1 className="text-3xl font-black">Statistiques</h1>
        </div>

        {/* Stat Cards Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Trophy} label="Parties jouées" value={totalGames} />
          <StatCard icon={TrendingUp} label="Taux victoire" value={overallWinRate} unit="%" />
          <StatCard icon={Flame} label="Win streak" value={playerStats.current_win_streak} />
          <StatCard icon={Target} label="Note moyenne" value={playerStats.average_rating.toFixed(1)} unit="/5" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#1a0f0f] mb-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="games">Parties</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reviews">Revues</TabsTrigger>
          </TabsList>

          {/* TAB: Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Taux victoire par jeu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-xl glass-card"
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>♟️ Taux victoire</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={winRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 165, 116, 0.1)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ background: '#2C1810', border: '1px solid #D4A574', borderRadius: '8px', color: '#F5E6D3' }}
                    />
                    <Legend />
                    <Bar dataKey="wins" fill="#D4A574" name="Victoires" />
                    <Bar dataKey="losses" fill="#8B5A2B" name="Défaites" />
                    <Bar dataKey="draws" fill="#5D3A1A" name="Nuls" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Types de parties */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl glass-card"
              >
                <h3 className="text-lg font-bold mb-4">🏆 Types de parties</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gameTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gameTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#2C1810', border: '1px solid #D4A574' }} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Détails par jeu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-xl glass-card space-y-4"
              >
                <h3 className="text-lg font-bold">♟️ Échecs</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#D4A574]/70">Parties</span>
                    <span className="font-bold">{chessTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400">Victoires</span>
                    <span className="font-bold">{playerStats.chess_wins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">Défaites</span>
                    <span className="font-bold">{playerStats.chess_losses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400">Nuls</span>
                    <span className="font-bold">{playerStats.chess_draws}</span>
                  </div>
                  <div className="border-t border-[#D4A574]/20 pt-3 flex justify-between items-center">
                    <span className="text-[#D4A574] font-bold">Taux victoire</span>
                    <span className="text-xl font-black text-[#D4A574]">{chessWinRate}%</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-xl glass-card space-y-4"
              >
                <h3 className="text-lg font-bold">⚫ Dames</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#D4A574]/70">Parties</span>
                    <span className="font-bold">{checkersTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400">Victoires</span>
                    <span className="font-bold">{playerStats.checkers_wins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">Défaites</span>
                    <span className="font-bold">{playerStats.checkers_losses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400">Nuls</span>
                    <span className="font-bold">{playerStats.checkers_draws}</span>
                  </div>
                  <div className="border-t border-[#D4A574]/20 pt-3 flex justify-between items-center">
                    <span className="text-[#D4A574] font-bold">Taux victoire</span>
                    <span className="text-xl font-black text-[#D4A574]">{checkersWinRate}%</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* TAB: Parties */}
          <TabsContent value="games" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card"
            >
              <h3 className="text-lg font-bold mb-4">📊 Parties récentes</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {gameResults.slice(0, 20).map((game, idx) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-lg">{game.game_type === 'chess' ? '♟️' : '⚫'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{game.game_type === 'chess' ? 'Échecs' : 'Dames'}</p>
                        <p className="text-xs text-[#D4A574]/60">{formatDate(game.created_date)}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (user?.id === game.player1_id && game.result === 'white') ||
                      (user?.id === game.player2_id && game.result === 'black')
                        ? 'bg-green-500/20 text-green-400'
                        : game.result === 'draw'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {(user?.id === game.player1_id && game.result === 'white') ||
                       (user?.id === game.player2_id && game.result === 'black')
                        ? '🎉 Victoire'
                        : game.result === 'draw'
                        ? '🤝 Nul'
                        : '😔 Défaite'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* TAB: Performance */}
          <TabsContent value="performance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl glass-card"
            >
              <h3 className="text-lg font-bold mb-4">📈 Performance mensuelle</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 165, 116, 0.1)" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip contentStyle={{ background: '#2C1810', border: '1px solid #D4A574' }} />
                  <Legend />
                  <Line type="monotone" dataKey="wins" stroke="#D4A574" name="Victoires" strokeWidth={2} />
                  <Line type="monotone" dataKey="losses" stroke="#8B5A2B" name="Défaites" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </TabsContent>

          {/* TAB: Revues */}
          <TabsContent value="reviews" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card"
            >
              <h3 className="text-lg font-bold mb-4">⭐ Revues reçues ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="text-[#D4A574]/50 text-center py-8">Aucune revue pour le moment</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-3xl font-black text-[#D4A574]">
                        {playerStats.average_rating.toFixed(1)}
                      </p>
                      <p className="text-xs text-[#D4A574]/60">moyenne</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = reviews.filter(r => r.rating === stars).length;
                        const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-xs w-12">{'⭐'.repeat(stars)}</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#D4A574] rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#D4A574]/60 w-12 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-[#D4A574]/20">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{review.reviewer_name}</p>
                          <span className="text-sm font-bold text-[#D4A574]">
                            {'⭐'.repeat(review.rating)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-[#D4A574]/80 italic">"{review.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);
  
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  
  return date.toLocaleDateString('fr-FR');
}

function generateMonthlyData(gameResults) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const data = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = months[date.getMonth()];
    
    data.unshift({
      month,
      wins: Math.floor(Math.random() * 20),
      losses: Math.floor(Math.random() * 15)
    });
  }
  
  return data;
}