import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Heart, Zap, TrendingUp, Clock } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white/10 to-white/5 border border-[#D4A574]/20 rounded-lg p-4"
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-2xl">{Icon}</span>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <p className="text-xs text-[#D4A574] font-semibold mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
    {subValue && <p className="text-xs text-[#D4A574]/70 mt-1">{subValue}</p>}
  </motion.div>
);

export default function StatsTab({ user }) {
  const gamesPlayed = user?.games_played || 0;
  const gamesWon = user?.games_won || 0;
  const gamesLost = user?.games_lost || 0;
  const gamesDraw = user?.games_drawn || 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const ratio = gamesWon > 0 ? (gamesWon / (gamesLost || 1)).toFixed(2) : '0.00';
  const totalTime = user?.total_playtime_seconds || 0;
  const hours = Math.floor(totalTime / 3600);

  const xpToNextLevel = (user?.level || 1) * 1000;
  const currentXp = user?.xp || 0;
  const xpProgress = Math.min(100, (currentXp / xpToNextLevel) * 100);

  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon="🎮"
          label="Parties jouées"
          value={gamesPlayed}
          color="text-blue-400"
        />
        <StatCard
          icon="🏆"
          label="Victoires"
          value={gamesWon}
          subValue={`${winRate}%`}
          color="text-yellow-400"
        />
        <StatCard
          icon="💔"
          label="Défaites"
          value={gamesLost}
          color="text-red-400"
        />
        <StatCard
          icon="🤝"
          label="Nulles"
          value={gamesDraw}
          color="text-purple-400"
        />
        <StatCard
          icon="📈"
          label="Ratio W/L"
          value={ratio}
          color="text-green-400"
        />
      </div>

      {/* Détails secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon="⏱️"
          label="Temps de jeu"
          value={`${hours}h`}
          subValue={`${totalTime % 3600} min`}
          color="text-cyan-400"
        />
        <StatCard
          icon="⭐"
          label="Niveau actuel"
          value={user?.level || 1}
          color="text-amber-400"
        />
        <StatCard
          icon="♟️"
          label="Classement Échecs"
          value={user?.chess_rating || 1200}
          color="text-blue-400"
        />
        <StatCard
          icon="⚫"
          label="Classement Dames"
          value={user?.checkers_rating || 1200}
          color="text-gray-400"
        />
        <StatCard
          icon="💎"
          label="Gemmes totales"
          value={user?.gems || 0}
          color="text-cyan-400"
        />
        <StatCard
          icon="🎯"
          label="Taux de victoire"
          value={`${winRate}%`}
          color="text-green-400"
        />
      </div>

      {/* Barre de progression XP */}
      <div className="bg-white/5 border border-[#D4A574]/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#D4A574]">Progression vers Niveau {(user?.level || 1) + 1}</h3>
          <span className="text-sm text-[#D4A574]/70">{currentXp} / {xpToNextLevel} XP</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
          />
        </div>
      </div>
    </div>
  );
}