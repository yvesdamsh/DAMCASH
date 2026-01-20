import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';

export default function Play() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#2d1515] to-[#1a0f0f] text-[#F5E6D3] flex flex-col items-center justify-center overflow-hidden p-4">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #D4A574 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-3xl mx-auto bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] backdrop-blur-md rounded-xl p-8 md:p-12 border border-[#D4A574]/50 shadow-2xl shadow-[#D4A574]/20"
      >
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[#F5E6D3] mb-3 leading-tight">
            Choisissez votre discipline
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4A574] to-transparent mx-auto" />
        </div>
        
        <p className="text-lg md:text-xl text-[#D4A574] mb-10 max-w-xl mx-auto">
          Maîtrisez l'art de la stratégie et de la tactique
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            onClick={() => navigate(createPageUrl('PlayChess'))}
            className="relative overflow-hidden group bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] font-bold py-6 px-8 rounded-lg shadow-lg hover:shadow-xl hover:shadow-[#D4A574]/30 transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            <span className="relative z-10 text-lg">Échecs</span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl('PlayCheckers'))}
            className="relative overflow-hidden group border-2 border-[#D4A574] bg-transparent text-[#F5E6D3] font-bold py-6 px-8 rounded-lg shadow-lg hover:bg-[#D4A574]/10 transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="relative z-10 text-lg">Dames</span>
          </Button>
        </div>
      </motion.div>

      {/* Footer gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a0f0f] to-transparent pointer-events-none" />
    </div>
  );
}