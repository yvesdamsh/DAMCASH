import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '@/components/play/HeroSection';
import GameCard from '@/components/play/GameCard';
import GameModesSection from '@/components/play/GameModesSection';
import DailyChallengesSection from '@/components/play/DailyChallengesSection';
import TopPlayersSection from '@/components/play/TopPlayersSection';

export default function PlayChess() {
  const game = {
    page: 'Chess',
    gameType: 'chess',
    title: '♟️ Échecs',
    description: 'Stratégie et tactique pour les maîtres',
    gradient: 'from-orange-600 via-amber-600 to-red-600',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
    difficulty: 'Expert',
    defaultPlayers: 512,
    rewards: '10-1000 gemmes',
    buttonClass: 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-[#F5E6D3] overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full mix-blend-screen"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: Math.random() * 8 + 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${['#8b5cf6', '#d946ef', '#3b82f6'][Math.floor(Math.random() * 3)]} 0%, transparent 70%)`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <HeroSection gameType="chess" />

        {/* Game Card */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-[#F5E6D3] mb-2">
            ♟️ Univers Échecs
          </h2>
          <p className="text-[#D4A574] text-lg mb-8">Stratégie, tactique et réflexion pour les maîtres du jeu</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GameCard game={game} isPopular={true} />
          </motion.div>
        </section>

        {/* Game Modes Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <GameModesSection gameType="chess" />
        </motion.section>

        {/* Daily Challenges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <DailyChallengesSection gameType="chess" />
        </motion.section>

        {/* Top Players Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <TopPlayersSection gameType="chess" />
        </motion.section>
      </div>

      {/* Footer gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-950 to-transparent pointer-events-none" />
    </div>
  );
}