import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Medal } from 'lucide-react';

const BADGE_MAP = {
  arena_daily: 'arena_daily_winner',
  arena_weekly: 'arena_weekly_winner',
  arena_monthly: 'arena_monthly_winner',
  arena_annual: 'arena_annual_winner',
  cup: 'cup_winner',
};

const BADGE_NAMES = {
  arena_daily: '⚡ Champion Arena Daily',
  arena_weekly: '🔥 Champion Arena Weekly',
  arena_monthly: '👑 Champion du Mois',
  arena_annual: '🏅 Champion Annuel',
  cup: '🛡 Vainqueur de Coupe',
};

export default function TournamentLeaderboard({ tournament, onClose }) {
  let scores = {};
  try { scores = JSON.parse(tournament.scores || '{}'); } catch {}

  const entries = Object.entries(scores)
    .map(([email, score]) => ({ email, score }))
    .sort((a, b) => b.score - a.score);

  const getRankIcon = (idx) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `#${idx + 1}`;
  };

  const getXP = (idx) => {
    const isArena = tournament.tournament_type !== 'cup';
    if (idx === 0) return isArena ? 200 : 300;
    if (idx === 1) return isArena ? 100 : 150;
    if (idx === 2) return isArena ? 50 : 75;
    return 25;
  };

  const getJetons = (idx) => {
    const prize = tournament.prize_gems || 0;
    if (idx === 0) return Math.round(prize * 0.6);
    if (idx === 1) return Math.round(prize * 0.3);
    if (idx === 2) return Math.round(prize * 0.1);
    return 0;
  };

  const badgeName = BADGE_NAMES[tournament.tournament_type] || '🏆 Champion';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-2xl overflow-hidden border border-[#D4A574]/30"
          style={{ background: 'linear-gradient(160deg, #1e0e06 0%, #2C1810 100%)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#D4A574]/20">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[#D4A574]" />
              <div>
                <h2 className="font-black text-[#F5E6D3]">Classement</h2>
                <p className="text-xs text-[#D4A574]/60 truncate max-w-[200px]">{tournament.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-all">
              <X className="w-5 h-5 text-[#D4A574]/60" />
            </button>
          </div>

          {/* Badge récompense */}
          <div className="mx-5 mt-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-900/20 border border-yellow-500/20">
            <Medal className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-300">
              Le vainqueur remporte le badge <span className="font-bold">{badgeName}</span>
            </p>
          </div>

          {/* Leaderboard */}
          <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-center text-[#D4A574]/40 py-8">Aucun score enregistré</p>
            ) : entries.map((entry, idx) => (
              <motion.div
                key={entry.email}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  idx === 0 ? 'bg-yellow-900/20 border-yellow-500/30' :
                  idx === 1 ? 'bg-gray-800/30 border-gray-500/20' :
                  idx === 2 ? 'bg-amber-900/20 border-amber-700/20' :
                  'bg-black/20 border-[#D4A574]/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{getRankIcon(idx)}</span>
                  <p className="text-sm font-semibold text-[#F5E6D3] truncate max-w-[150px]">{entry.email.split('@')[0]}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="font-black text-[#D4A574]">{entry.score} pts</div>
                    {getJetons(idx) > 0 && (
                      <div className="text-xs text-yellow-400">{getJetons(idx)} 🪙 +{getXP(idx)} XP</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}