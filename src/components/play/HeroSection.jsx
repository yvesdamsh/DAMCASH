import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function HeroSection() {
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
    <div className="relative overflow-hidden rounded-3xl mb-12 h-80">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-orange-500 to-amber-600 opacity-80">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-purple-600 to-amber-600 opacity-0"
          animate={{
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-white/10 blur-3xl"
            animate={{
              x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
              y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-lg"
        >
          🎮 Affrontez les meilleurs joueurs
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow"
        >
          Choisissez votre mode de jeu et gagnez des gemmes
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-8 md:gap-16"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg"
            >
              {stats.onlinePlayers.toLocaleString()}
            </motion.div>
            <p className="text-white/80 text-sm">Joueurs en ligne</p>
          </div>
          <div className="h-12 w-0.5 bg-white/30" />
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg"
            >
              {stats.activeGames.toLocaleString()}
            </motion.div>
            <p className="text-white/80 text-sm">Parties actives</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}