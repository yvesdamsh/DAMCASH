import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Trophy, Target, Flame, BarChart3, Award, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BADGE_CONFIG = {
  first_win:            { emoji: '🥇', label: 'Première Victoire', color: 'from-yellow-900/40 to-yellow-800/20', border: 'border-yellow-500/40', text: 'text-yellow-300' },
  win_streak_5:         { emoji: '🔥', label: 'Série Dorée (x5)', color: 'from-orange-900/40 to-orange-800/20', border: 'border-orange-500/40', text: 'text-orange-300' },
  tournament_participant:{ emoji: '🏆', label: 'Compétiteur', color: 'from-purple-900/40 to-purple-800/20', border: 'border-purple-500/40', text: 'text-purple-300' },
  first_tournament_win: { emoji: '👑', label: 'Champion', color: 'from-amber-900/40 to-amber-800/20', border: 'border-amber-500/40', text: 'text-amber-300' },
  chess_master:         { emoji: '♟', label: 'Maître Échecs', color: 'from-blue-900/40 to-blue-800/20', border: 'border-blue-500/40', text: 'text-blue-300' },
  checkers_master:      { emoji: '⚫', label: 'Maître Dames', color: 'from-green-900/40 to-green-800/20', border: 'border-green-500/40', text: 'text-green-300' },
};

const CHART_STYLE = { background: '#2C1810', border: '1px solid #D4A574', borderRadius: '8px', color: '#F5E6D3' };

function WinRateDonut({ wins, losses, draws, label, icon }) {
  const total = wins + losses + draws;
  const data = [
    { name: 'Victoires', value: wins, fill: '#22c55e' },
    { name: 'Défaites', value: losses, fill: '#ef4444' },
    { name: 'Nuls', value: draws, fill: '#60a5fa' },
  ];
  const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="p-5 rounded-xl glass-card">
      <h3 className="text-base font-bold mb-1 flex items-center gap-2">
        <span>{icon}</span>{label}
      </h3>
      <p className="text-xs text-[#D4A574]/50 mb-3">{total} parties jouées</p>

      <div className="flex items-center gap-4">
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={total > 0 ? data : [{ name: '-', value: 1, fill: '#3E2723' }]}
                cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270}>
                {(total > 0 ? data : [{ fill: '#3E2723' }]).map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-[#D4A574]">{winPct}%</span>
            <span className="text-[9px] text-[#D4A574]/50 uppercase tracking-wider">victoires</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[
            { label: 'Victoires', value: wins, pct: total > 0 ? ((wins/total)*100).toFixed(0) : 0, color: 'bg-green-500', textColor: 'text-green-400' },
            { label: 'Défaites', value: losses, pct: total > 0 ? ((losses/total)*100).toFixed(0) : 0, color: 'bg-red-500', textColor: 'text-red-400' },
            { label: 'Nuls', value: draws, pct: total > 0 ? ((draws/total)*100).toFixed(0) : 0, color: 'bg-blue-500', textColor: 'text-blue-400' },
          ].map(r => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className={r.textColor}>{r.label}</span>
                <span className="text-[#F5E6D3] font-bold">{r.value} <span className="text-[#D4A574]/40">({r.pct}%)</span></span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function EloChart({ history, gameType }) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#D4A574]/30">
        <TrendingUp className="w-10 h-10 mb-3" />
        <p className="text-sm">Aucun historique ELO disponible</p>
        <p className="text-xs mt-1">Jouez des parties classées pour voir votre progression</p>
      </div>
    );
  }

  const data = history.map(r => ({
    date: format(new Date(r.timestamp || r.created_date), 'dd/MM', { locale: fr }),
    rating: r.rating_after,
    change: r.rating_change,
  }));

  const peak = Math.max(...history.map(r => r.rating_after));
  const current = history[history.length - 1]?.rating_after || 0;
  const lowest = Math.min(...history.map(r => r.rating_after));
  const totalChange = current - (history[0]?.rating_before || current);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Plus haute', value: peak, color: 'text-green-400' },
          { label: 'Actuelle', value: current, color: 'text-[#D4A574]' },
          { label: 'Plus basse', value: lowest, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-black/20 rounded-xl p-3 text-center border border-[#D4A574]/10">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-[#D4A574]/40 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#D4A574]/60">Progression totale :</span>
        <span className={`font-black ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalChange >= 0 ? '+' : ''}{totalChange} pts
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,116,0.1)" />
          <XAxis dataKey="date" tick={{ fill: '#D4A574', fontSize: 11 }} />
          <YAxis tick={{ fill: '#D4A574', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={CHART_STYLE}
            formatter={(val, name) => [val, name === 'rating' ? 'ELO' : 'Variation']} />
          <Line type="monotone" dataKey="rating" stroke="#D4A574" strokeWidth={2.5}
            dot={{ fill: '#D4A574', r: 3 }} name="rating" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StreakCard({ current, longest, label, icon }) {
  const bars = Math.min(longest, 10);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl glass-card space-y-3">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <span>{icon}</span>{label}
      </h3>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-3xl font-black text-orange-400">{current}</p>
          <p className="text-xs text-[#D4A574]/50">Série actuelle</p>
        </div>
        <div className="border-l border-[#D4A574]/20 pl-4">
          <p className="text-3xl font-black text-[#D4A574]">{longest}</p>
          <p className="text-xs text-[#D4A574]/50">Meilleure série</p>
        </div>
      </div>
      {/* Visualisation de la série */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: Math.max(bars, 5) }).map((_, i) => (
          <div key={i} className={`h-3 w-3 rounded-sm transition-all ${
            i < current ? 'bg-orange-400' : i < longest ? 'bg-[#D4A574]/30' : 'bg-white/5'
          }`} />
        ))}
        {longest > 10 && <span className="text-xs text-[#D4A574]/40 ml-1">+{longest - 10}</span>}
      </div>
      <p className="text-[10px] text-[#D4A574]/30">🟠 Actuel · 🟡 Meilleur historique</p>
    </motion.div>
  );
}

function BadgesSection({ badges }) {
  if (badges.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-[#D4A574]/30">
        <Award className="w-10 h-10 mb-3" />
        <p className="text-sm">Aucun badge pour le moment</p>
        <p className="text-xs mt-1">Jouez et progressez pour débloquer des badges !</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((badge, i) => {
        const cfg = BADGE_CONFIG[badge.badge_type] || {
          emoji: '🎖', label: badge.name || badge.badge_type,
          color: 'from-gray-900/40 to-gray-800/20', border: 'border-gray-500/40', text: 'text-gray-300'
        };
        return (
          <motion.div key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className={`bg-gradient-to-br ${cfg.color} border ${cfg.border} rounded-xl p-4 flex flex-col items-center gap-2 text-center`}>
            <div className="text-3xl">{cfg.emoji}</div>
            <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
            {badge.earned_at && (
              <p className="text-[10px] text-[#D4A574]/30">
                {format(new Date(badge.earned_at), 'dd MMM yyyy', { locale: fr })}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function Statistics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: playerStats, isLoading: loadingStats } = useQuery({
    queryKey: ['playerStats', user?.id],
    queryFn: () => base44.entities.PlayerStats.filter({ user_id: user.id }).then(r => r?.[0] || null),
    enabled: !!user?.id
  });

  const { data: eloHistory = [] } = useQuery({
    queryKey: ['eloHistory', user?.id],
    queryFn: () => base44.entities.ELORating.filter({ user_id: user.id }, 'timestamp', 100),
    enabled: !!user?.id
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: () => base44.entities.Badge.filter({ user_id: user.id }),
    enabled: !!user?.id
  });

  const { data: gameResults = [] } = useQuery({
    queryKey: ['userGameResults', user?.id],
    queryFn: async () => {
      const results = await base44.entities.GameResult.filter({}, '-created_date', 100);
      return results.filter(r => r.player1_id === user.id || r.player2_id === user.id);
    },
    enabled: !!user?.id
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['userReviews', user?.id],
    queryFn: async () => {
      const results = await base44.entities.GameReview.filter({});
      return results.filter(r => r.reviewed_player_id === user.id);
    },
    enabled: !!user?.id
  });

  if (!user || loadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4A574]" />
      </div>
    );
  }

  const ps = playerStats || {};
  const chessTotal = (ps.chess_wins || 0) + (ps.chess_losses || 0) + (ps.chess_draws || 0);
  const checkersTotal = (ps.checkers_wins || 0) + (ps.checkers_losses || 0) + (ps.checkers_draws || 0);
  const totalGames = chessTotal + checkersTotal;
  const totalWins = (ps.chess_wins || 0) + (ps.checkers_wins || 0);
  const overallWinRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0;

  const chessElo = eloHistory.filter(r => r.game_type === 'chess');
  const checkersElo = eloHistory.filter(r => r.game_type === 'checkers');

  const StatCard = ({ icon: Icon, label, value, unit = '', color = '#D4A574' }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-[#3E2723] to-[#2C1810] border border-[#D4A574]/20 space-y-2">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Trophy} label="Parties jouées" value={totalGames} />
          <StatCard icon={TrendingUp} label="Taux victoire" value={overallWinRate} unit="%" />
          <StatCard icon={Flame} label="Série actuelle" value={ps.current_win_streak || 0} />
          <StatCard icon={Award} label="Badges" value={badges.length} color="#a78bfa" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-[#1a0f0f] mb-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="elo">ELO</TabsTrigger>
            <TabsTrigger value="streaks">Séries</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="reviews">Revues</TabsTrigger>
          </TabsList>

          {/* ─── TAB: Vue d'ensemble ─── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Donut charts par jeu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WinRateDonut wins={ps.chess_wins || 0} losses={ps.chess_losses || 0} draws={ps.chess_draws || 0}
                label="Échecs" icon="♟️" />
              <WinRateDonut wins={ps.checkers_wins || 0} losses={ps.checkers_losses || 0} draws={ps.checkers_draws || 0}
                label="Dames" icon="⚫" />
            </div>

            {/* Barres côte à côte */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <h3 className="text-base font-bold mb-4">📊 V/D/N par jeu</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { name: '♟️ Échecs', V: ps.chess_wins || 0, D: ps.chess_losses || 0, N: ps.chess_draws || 0 },
                  { name: '⚫ Dames', V: ps.checkers_wins || 0, D: ps.checkers_losses || 0, N: ps.checkers_draws || 0 },
                ]} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,116,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#D4A574', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#D4A574', fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_STYLE} />
                  <Legend formatter={v => ({ V: 'Victoires', D: 'Défaites', N: 'Nuls' }[v] || v)} />
                  <Bar dataKey="V" fill="#22c55e" name="V" radius={[4,4,0,0]} />
                  <Bar dataKey="D" fill="#ef4444" name="D" radius={[4,4,0,0]} />
                  <Bar dataKey="N" fill="#60a5fa" name="N" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Classées vs Casual */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <h3 className="text-base font-bold mb-4">🎮 Types de parties</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { value: ps.ranked_games_count || 0, fill: '#D4A574' },
                        { value: ps.casual_games_count || 0, fill: '#5D3A1A' },
                      ]} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                        <Cell fill="#D4A574" />
                        <Cell fill="#5D3A1A" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#D4A574]" /><span className="text-sm">Classées</span></div>
                    <span className="font-black text-[#D4A574]">{ps.ranked_games_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#5D3A1A]" /><span className="text-sm">Non classées</span></div>
                    <span className="font-black text-[#D4A574]/60">{ps.casual_games_count || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ─── TAB: ELO ─── */}
          <TabsContent value="elo" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <span>♟️</span> Historique ELO — Échecs
              </h3>
              <EloChart history={chessElo} gameType="chess" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <span>⚫</span> Historique ELO — Dames
              </h3>
              <EloChart history={checkersElo} gameType="checkers" />
            </motion.div>

            {/* Ratings actuels depuis profil */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-card flex items-center gap-3">
                <span className="text-3xl">♟️</span>
                <div>
                  <p className="text-xs text-[#D4A574]/50 uppercase tracking-wider">Rating Échecs</p>
                  <p className="text-2xl font-black text-[#D4A574]">{user.chess_rating || 1200}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl glass-card flex items-center gap-3">
                <span className="text-3xl">⚫</span>
                <div>
                  <p className="text-xs text-[#D4A574]/50 uppercase tracking-wider">Rating Dames</p>
                  <p className="text-2xl font-black text-[#D4A574]">{user.checkers_rating || 1200}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── TAB: Séries ─── */}
          <TabsContent value="streaks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <StreakCard
                current={ps.current_win_streak || 0}
                longest={ps.longest_win_streak || 0}
                label="Séries de victoires (toutes)"
                icon="🔥"
              />
              {/* Simuler pour chess / checkers via history */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl glass-card space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>📈</span> Progression XP
                </h3>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-3xl font-black text-purple-400">{user.xp || 0}</p>
                    <p className="text-xs text-[#D4A574]/50">XP total</p>
                  </div>
                  <div className="border-l border-[#D4A574]/20 pl-4">
                    <p className="text-3xl font-black text-[#D4A574]">{user.level || 1}</p>
                    <p className="text-xs text-[#D4A574]/50">Niveau</p>
                  </div>
                </div>
                {/* Barre XP vers prochain niveau */}
                <div>
                  <div className="flex justify-between text-xs text-[#D4A574]/50 mb-1">
                    <span>Niveau {user.level || 1}</span>
                    <span>Niveau {(user.level || 1) + 1}</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((user.xp || 0) % 500) / 5}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-[#D4A574]/40 mt-1">{(user.xp || 0) % 500} / 500 XP</p>
                </div>
              </motion.div>
            </div>

            {/* Meilleurs résultats récents */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <h3 className="text-base font-bold mb-4">🎯 Dernières parties</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {gameResults.length === 0 ? (
                  <p className="text-[#D4A574]/40 text-center py-6">Aucune partie enregistrée</p>
                ) : gameResults.slice(0, 15).map(game => {
                  const isPlayer1 = user?.id === game.player1_id;
                  const won = (isPlayer1 && game.result === 'white') || (!isPlayer1 && game.result === 'black');
                  const isDraw = game.result === 'draw';
                  return (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span>{game.game_type === 'chess' ? '♟️' : '⚫'}</span>
                        <div>
                          <p className="text-sm font-semibold">
                            vs {isPlayer1 ? game.player2_name : game.player1_name}
                          </p>
                          <p className="text-xs text-[#D4A574]/40">{formatDate(game.created_date)}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isDraw ? 'bg-blue-500/20 text-blue-400' :
                        won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isDraw ? '🤝 Nul' : won ? '🏆 Victoire' : '😔 Défaite'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </TabsContent>

          {/* ─── TAB: Badges ─── */}
          <TabsContent value="badges" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#D4A574]" />
                  Badges obtenus
                </h3>
                <span className="text-sm font-black text-[#D4A574]">{badges.length} badge{badges.length !== 1 ? 's' : ''}</span>
              </div>
              <BadgesSection badges={badges} />
            </motion.div>

            {/* Badges à débloquer */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <h3 className="text-base font-bold mb-4 text-[#D4A574]/60">🔒 Badges à débloquer</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(BADGE_CONFIG)
                  .filter(([type]) => !badges.some(b => b.badge_type === type))
                  .map(([type, cfg]) => (
                    <div key={type} className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-2 text-center opacity-40">
                      <div className="text-3xl grayscale">{cfg.emoji}</div>
                      <p className="text-xs text-[#D4A574]/50">{cfg.label}</p>
                    </div>
                  ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* ─── TAB: Revues ─── */}
          <TabsContent value="reviews" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl glass-card">
              <h3 className="text-base font-bold mb-4">⭐ Revues reçues ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="text-[#D4A574]/50 text-center py-8">Aucune revue pour le moment</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-4xl font-black text-[#D4A574]">{(ps.average_rating || 0).toFixed(1)}</p>
                      <p className="text-xs text-[#D4A574]/60">/ 5</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = reviews.filter(r => r.rating === stars).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-xs w-8 text-[#D4A574]/60">{stars}★</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#D4A574] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-[#D4A574]/40 w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-[#D4A574]/20">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{review.reviewer_name}</p>
                          <span className="text-sm font-bold text-[#D4A574]">{'⭐'.repeat(review.rating)}</span>
                        </div>
                        {review.comment && <p className="text-sm text-[#D4A574]/70 italic">"{review.comment}"</p>}
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
  const diff = Date.now() - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}