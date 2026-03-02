import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Activity, Eye, Gem, ChevronRight, Swords } from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';

export default function Colisee() {
  const [liveGames, setLiveGames] = useState([]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    loadLiveGames();
    const interval = setInterval(loadLiveGames, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const p = setInterval(() => setPulse(v => !v), 1500);
    return () => clearInterval(p);
  }, []);

  const loadLiveGames = async () => {
    try {
      const sessions = await base44.entities.GameSession.filter({ status: 'in_progress' }, '-updated_date', 20);
      // Garder seulement les parties actives depuis moins de 30 minutes
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const recentSessions = sessions.filter(s => s.updated_date >= thirtyMinsAgo);

      if (recentSessions.length > 0) {
        // Trier par nombre de spectateurs décroissant, prendre les 2 premières
        const sorted = recentSessions
          .sort((a, b) => (b.spectators_count || 0) - (a.spectators_count || 0))
          .slice(0, 2)
          .map((session) => ({
            ...session,
            player1_data: { full_name: session.player1_name },
            player2_data: { full_name: session.player2_name },
            spectators: session.spectators_count || 0
          }));
        setLiveGames(sorted);
      } else {
        setLiveGames([]);
      }
    } catch (e) {
      setLiveGames([]);
    }
  };

  // Ne pas masquer le composant, afficher un état vide à la place

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-6 h-6 text-[#D4A574]" />
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-[#D4A574]/30"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-widest text-[#F5E6D3] uppercase">Le Colisée</h2>
            <p className="text-xs text-[#D4A574]/70 tracking-wider">Parties les plus suivies</p>
          </div>
        </div>
        <Link
          to={createPageUrl('Spectate')}
          className="flex items-center gap-1 text-xs text-[#D4A574] hover:text-[#F5E6D3] transition-colors font-semibold tracking-wider uppercase"
        >
          Toute l'arène <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveGames.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-xl border border-[#D4A574]/20 hover:border-[#D4A574]/50 transition-colors group cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1e0e08 0%, #2C1810 50%, #1e0e08 100%)' }}
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(212,165,116,0.05) 50%, transparent 60%)' }}
            />

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#D4A574]/10 bg-black/30">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-500"
                />
                <span className="text-red-400 text-xs font-black tracking-widest">LIVE</span>
                <span className="text-[#D4A574]/50 text-xs">• {game.spectators} spectateurs</span>
              </div>
              <span className="text-xs text-[#D4A574]/40 uppercase">
                {game.game_type === 'chess' ? '♟ Échecs' : '⚫ Dames'}
              </span>
            </div>

            {/* Content: board + players */}
            <div className="flex gap-4 p-4">
              {/* Board miniature */}
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[#D4A574]/20 relative">
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className={(Math.floor(i / 8) + i) % 2 === 0 ? 'bg-[#8B5A2B]' : 'bg-[#2C1810]'} />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Players */}
              <div className="flex-1 flex flex-col justify-between">
                {/* Player 1 */}
                <div className="flex items-center gap-2">
                  <UserAvatar user={{ full_name: game.player1_data.full_name }} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-[#F5E6D3] leading-none">{game.player1_data.full_name}</p>
                    <p className="text-xs text-[#D4A574]/60">1200 ELO</p>
                  </div>
                </div>

                {/* VS Separator */}
                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-[#D4A574]/10" />
                  <div className="flex items-center gap-1">
                    <Swords className="w-3 h-3 text-[#D4A574]/40" />
                    <span className="text-xs text-[#D4A574]/40 font-bold">VS</span>
                  </div>
                  <div className="flex-1 h-px bg-[#D4A574]/10" />
                </div>

                {/* Player 2 */}
                <div className="flex items-center gap-2">
                  <UserAvatar user={{ full_name: game.player2_data.full_name }} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-[#F5E6D3] leading-none">{game.player2_data.full_name}</p>
                    <p className="text-xs text-[#D4A574]/60">1200 ELO</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#D4A574]/10 bg-black/20">
              <div className="flex items-center gap-1 text-[#D4A574]/60 text-xs">
                <Gem className="w-3 h-3" />
                <span>Enjeu libre</span>
              </div>
              <Link to={`${createPageUrl('GameRoom')}?roomId=${game.room_id}`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 text-xs font-bold text-[#D4A574] hover:text-[#F5E6D3] bg-[#D4A574]/10 hover:bg-[#D4A574]/20 px-3 py-1.5 rounded-full transition-all"
                >
                  <Eye className="w-3 h-3" /> Regarder
                </motion.button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}