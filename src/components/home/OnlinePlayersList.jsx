import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import PlayerPopup from '@/components/ui/PlayerPopup';

export default function OnlinePlayersList() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await base44.entities.OnlineUser.list('-last_seen', 30);
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        setPlayers(all.filter(u => u.last_seen >= twoMinutesAgo));
      } catch {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (players.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[#D4A574]/60 uppercase tracking-widest flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
          </div>
          Joueurs en ligne
        </h2>
        <span className="text-xs text-green-400 font-semibold">{players.length} connecté{players.length > 1 ? 's' : ''}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {players.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <PlayerPopup
              playerId={player.user_id}
              playerName={player.username}
              playerAvatar={player.avatar_url}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4A574]/15 bg-black/20 hover:border-[#D4A574]/40 transition-all cursor-pointer">
                <div className="relative">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} className="w-5 h-5 rounded-full object-cover" alt={player.username} />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#5D3A1A] border border-[#D4A574]/30 flex items-center justify-center text-[9px] font-bold text-[#D4A574]">
                      {player.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-[#2C1810]" />
                </div>
                <span className="text-xs text-[#F5E6D3]/80 font-medium max-w-[80px] truncate">
                  {player.username || 'Joueur'}
                </span>
              </div>
            </PlayerPopup>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}