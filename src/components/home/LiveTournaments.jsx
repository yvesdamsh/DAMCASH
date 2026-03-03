import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Activity, Users, ChevronRight, Trophy } from 'lucide-react';

export default function LiveTournaments({ gameType }) {
  const [tournaments, setTournaments] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    loadTournaments();
    const interval = setInterval(loadTournaments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = {};
      tournaments.forEach(t => {
        if (t.start_date) {
          const diff = new Date(t.start_date) - new Date();
          const totalSecs = Math.max(0, Math.floor(diff / 1000));
          const h = Math.floor(totalSecs / 3600);
          const m = Math.floor((totalSecs % 3600) / 60);
          const s = totalSecs % 60;
          newTimeLeft[t.id] = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [tournaments]);

  const loadTournaments = async () => {
    try {
      const filterObj = gameType
        ? { status: 'in_progress', game_type: gameType }
        : { status: 'in_progress' };
      const data = await base44.entities.Tournament.filter(filterObj, '-start_date', 2);
      setTournaments(data);
    } catch (e) {
      setTournaments([]);
    }
  };

  if (!tournaments || tournaments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/30">
            <Activity className="w-5 h-5 text-red-500" />
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="absolute inset-0 rounded-lg border border-red-500/50"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-widest text-[#F5E6D3] uppercase">Tournois en cours</h2>
            <p className="text-xs text-[#D4A574]/70 tracking-wider">Compétitions actives</p>
          </div>
        </div>
        <Link
          to={createPageUrl('Tournaments')}
          className="flex items-center gap-1 text-xs text-[#D4A574] hover:text-[#F5E6D3] transition-colors font-semibold tracking-wider uppercase"
        >
          Voir tout <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map((tournament, idx) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.12, duration: 0.4 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-xl border border-red-900/40 hover:border-red-500/40 transition-colors group"
            style={{ background: 'linear-gradient(135deg, #1a0505 0%, #2C1010 60%, #1a0505 100%)' }}
          >
            {/* Glow top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

            {/* LIVE badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full">
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-white"
              />
              <span className="text-white text-xs font-black tracking-widest">LIVE</span>
            </div>

            <div className="p-5">
              {/* Game type + format badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs text-red-400/70 uppercase tracking-widest font-semibold">
                  {tournament.game_type === 'chess' ? '♟ Échecs' : '⚫ Dames'}
                </span>
                {tournament.tournament_type?.startsWith('arena') ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-600/30 text-orange-400 border border-orange-500/30">
                    🏟 Arena
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600/30 text-purple-400 border border-purple-500/30">
                    ⚔️ Coupe
                  </span>
                )}
              </div>

              {/* Name */}
              <h3 className="text-lg font-black text-[#F5E6D3] mb-1 pr-16 leading-tight">
                {tournament.name}
              </h3>
              <p className="text-[11px] text-[#D4A574]/50 mb-3 leading-relaxed">
                {tournament.tournament_type?.startsWith('arena')
                  ? 'Adversaires aléatoires · Marquez un max de points en temps limité'
                  : 'Tous contre tous · Le meilleur score du groupe l\'emporte'}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-black/30 rounded-lg p-3 border border-red-900/30">
                  <p className="text-xs text-[#D4A574]/50 uppercase tracking-wider mb-1">Fin dans</p>
                  <p className="text-2xl font-black text-red-500 font-mono tracking-widest">
                    {timeLeft[tournament.id] ? timeLeft[tournament.id].slice(3) : '--:--'}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-red-900/30">
                  <p className="text-xs text-[#D4A574]/50 uppercase tracking-wider mb-1">Participants</p>
                  <div className="flex items-end gap-1">
                    <p className="text-2xl font-black text-[#F5E6D3]">
                      {tournament.participants?.length || 0}
                    </p>
                    <p className="text-xs text-[#D4A574]/40 mb-1">/ {tournament.max_participants || '∞'}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <Link to={createPageUrl('Tournaments')}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full relative overflow-hidden bg-red-700 hover:bg-red-600 text-white font-black py-3 rounded-lg transition-colors tracking-widest text-sm uppercase"
                >
                  <span className="relative z-10">Rejoindre l'action</span>
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                  />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}