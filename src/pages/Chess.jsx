import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { Trophy, Swords, Crown, Users, Puzzle } from 'lucide-react';
import LiveTournaments from '../components/home/LiveTournaments';
import Colisee from '../components/home/Colisee';
import HeroSection from '../components/play/HeroSection';
import DailyChallengesSection from '../components/play/DailyChallengesSection';
import TopPlayersSection from '../components/play/TopPlayersSection';

export default function Chess() {
  return (
    <div className="relative min-h-screen text-[#F5E6D3]">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #D4A574 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Universe header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">♟️</span>
            <div>
              <h1 className="text-2xl font-black text-[#F5E6D3]">Univers Échecs</h1>
              <p className="text-xs text-[#D4A574]/60 uppercase tracking-widest">Stratégie & maîtrise</p>
            </div>
          </div>
          <Link to={createPageUrl('Checkers')} className="inline-flex items-center gap-1.5 text-xs text-[#D4A574]/50 hover:text-[#D4A574] transition-colors mt-1 border border-[#D4A574]/15 hover:border-[#D4A574]/40 px-3 py-1.5 rounded-full">
            ⚫ Passer aux Dames →
          </Link>
        </motion.div>

        {/* Play CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Link to={createPageUrl('PlayChess')} className="block w-full relative overflow-hidden rounded-xl shadow-2xl shadow-amber-900/30">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full p-4 bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 text-white font-black text-lg tracking-wide flex items-center justify-center gap-3 rounded-xl"
            >
              <Crown className="w-6 h-6" /> Jouer aux Échecs
            </motion.button>
            <motion.div
              animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-xl"
            />
          </Link>
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3 mb-8">
          <Link to={`${createPageUrl('Tournaments')}?game=chess`}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#D4A574]/15 hover:border-[#D4A574]/40 bg-black/20 transition-all">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-[#F5E6D3]/80 font-semibold">Tournois</span>
          </Link>
          <Link to={`${createPageUrl('MiniTournaments')}?game=chess`}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#D4A574]/15 hover:border-[#D4A574]/40 bg-black/20 transition-all">
            <Swords className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-[#F5E6D3]/80 font-semibold">Salons</span>
          </Link>
          <Link to={createPageUrl('Puzzles')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#D4A574]/15 hover:border-[#D4A574]/40 bg-black/20 transition-all">
            <Puzzle className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-[#F5E6D3]/80 font-semibold">Puzzles</span>
          </Link>
        </motion.div>

        {/* Live Tournaments (chess only) */}
        <LiveTournaments gameType="chess" />

        {/* Colisée (chess only) */}
        <Colisee gameType="chess" />

        {/* Daily Challenges */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <DailyChallengesSection gameType="chess" />
        </motion.div>

        {/* Top Players */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <TopPlayersSection gameType="chess" />
        </motion.div>
      </div>
    </div>
  );
}