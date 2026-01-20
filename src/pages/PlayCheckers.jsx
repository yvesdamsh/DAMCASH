import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '@/components/play/HeroSection';
import GameCard from '@/components/play/GameCard';
import GameModesSection from '@/components/play/GameModesSection';
import DailyChallengesSection from '@/components/play/DailyChallengesSection';
import TopPlayersSection from '@/components/play/TopPlayersSection';

export default function PlayCheckers() {
  const game = {
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
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#2d1515] to-[#1a0f0f] text-[#F5E6D3] overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #D4A574 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <HeroSection gameType="checkers" />

        {/* Game Card */}
        <section className="mb-16">
          <div className="border-l-4 border-[#D4A574] pl-6 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F5E6D3] mb-2">
              Dames
            </h2>
            <p className="text-[#D4A574] text-lg">Jeu classique et passionnant accessible à tous</p>
          </div>

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
          <GameModesSection gameType="checkers" />
        </motion.section>

        {/* Daily Challenges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <DailyChallengesSection gameType="checkers" />
        </motion.section>

        {/* Top Players Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <TopPlayersSection gameType="checkers" />
        </motion.section>
      </div>

      {/* Footer gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a0f0f] to-transparent pointer-events-none" />
    </div>
  );
}