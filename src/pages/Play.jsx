import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '@/components/play/HeroSection';
import GameCard from '@/components/play/GameCard';
import GameModesSection from '@/components/play/GameModesSection';
import DailyChallengesSection from '@/components/play/DailyChallengesSection';
import TopPlayersSection from '@/components/play/TopPlayersSection';

export default function Play() {
  const [sessionCount, setSessionCount] = useState(0);

  const games = [
    {
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
    },
    {
      page: 'Checkers',
      gameType: 'checkers',
      title: '⚫ Dames',
      description: 'Classique et passionnant pour tous',
      gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
      pattern: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%)',
      difficulty: 'Accessible',
      defaultPlayers: 324,
      rewards: '5-500 gemmes',
      buttonClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
    }
  ];

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
        <HeroSection />

        {/* Games Section */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-[#F5E6D3] mb-2">
            🎮 Choisir un jeu
          </h2>
          <p className="text-[#D4A574] text-lg mb-8">Sélectionnez votre jeu préféré et commencez à jouer</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {games.map((game, idx) => {
              const isPopular = idx === 0;
              return (
                <motion.div
                  key={game.page}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                >
                  <GameCard game={game} isPopular={isPopular} />
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Game Modes Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <GameModesSection />
        </motion.section>

        {/* Daily Challenges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <DailyChallengesSection />
        </motion.section>

        {/* Top Players Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <TopPlayersSection />
        </motion.section>
      </div>

      {/* Footer gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-950 to-transparent pointer-events-none" />
    </div>
  );
}