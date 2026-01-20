import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function HeroSection({ gameType }) {
  const [stats, setStats] = useState({
    onlinePlayers: 1234,
    activeGames: 456
  });

  useEffect(() => {
    const updateStats = async () => {
      try {
        const onlineUsers = await base44.entities.OnlineUser.filter({ status: 'online' });
        const gameSessions = await base44.entities.GameSession.filter({ status: 'in_progress' });
        setStats({
          onlinePlayers: onlineUsers?.length || 1234,
          activeGames: gameSessions?.length || 456
        });
      } catch (e) {
        console.log('Stats update failed');
      }
    };
    
    updateStats();
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl mb-12 border border-[#D4A574]/30 bg-gradient-to-br from-[#2C1810] to-[#5D3A1A]">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(45deg, #D4A574 25%, transparent 25%, transparent 75%, #D4A574 75%, #D4A574), linear-gradient(45deg, #D4A574 25%, transparent 25%, transparent 75%, #D4A574 75%, #D4A574)',
        backgroundSize: '60px 60px',
        backgroundPosition: '0 0, 30px 30px'
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#F5E6D3] mb-3">
            Affrontez les meilleurs joueurs
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#D4A574] to-transparent mx-auto" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-[#D4A574] mb-10 max-w-2xl"
        >
          Choisissez votre mode de jeu et démontrez votre maîtrise
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-12 md:gap-20"
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[#D4A574] mb-2">
              {stats.onlinePlayers.toLocaleString()}
            </div>
            <p className="text-[#F5E6D3]/70 text-sm uppercase tracking-wider">Joueurs en ligne</p>
          </div>
          <div className="h-16 w-px bg-[#D4A574]/30" />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[#D4A574] mb-2">
              {stats.activeGames.toLocaleString()}
            </div>
            <p className="text-[#F5E6D3]/70 text-sm uppercase tracking-wider">Parties actives</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}