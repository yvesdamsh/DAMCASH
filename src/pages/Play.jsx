import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';

export default function Play() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-[#F5E6D3] flex flex-col items-center justify-center overflow-hidden p-4">
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

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-2xl mx-auto bg-gradient-to-br from-[#2C1810]/70 to-[#5D3A1A]/70 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-[#D4A574]/40 shadow-2xl"
      >
        <h1 className="text-4xl md:text-5xl font-black text-[#F5E6D3] mb-4 leading-tight">
          Choisissez votre arène
        </h1>
        <p className="text-lg md:text-xl text-[#D4A574] mb-8">
          Plongez dans le monde de la stratégie et de la réflexion. Quel défi relèverez-vous aujourd'hui ?
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <Button
            onClick={() => navigate(createPageUrl('PlayChess'))}
            className="relative overflow-hidden group gold-gradient text-[#2C1810] font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            <span className="relative z-10 text-lg">♟️ Jouer aux Échecs</span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl('PlayCheckers'))}
            className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            <span className="relative z-10 text-lg">⚫ Jouer aux Dames</span>
          </Button>
        </div>
      </motion.div>

      {/* Footer gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-950 to-transparent pointer-events-none" />
    </div>
  );
}