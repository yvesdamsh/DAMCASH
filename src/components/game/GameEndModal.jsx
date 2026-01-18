import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, Home, Trophy, Frown } from 'lucide-react';

export default function GameEndModal({ show, winner, playerColor, onReplay, onHome }) {
  const isWinner = winner === playerColor;
  
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] border-4 border-[#D4A574] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Icon */}
            <motion.div
              animate={{ 
                rotate: isWinner ? [0, -10, 10, -10, 0] : 0,
                scale: isWinner ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                duration: 0.5, 
                repeat: isWinner ? Infinity : 0, 
                repeatDelay: 1 
              }}
              className="flex justify-center mb-6"
            >
              {isWinner ? (
                <Trophy className="w-24 h-24 text-amber-400" />
              ) : (
                <Frown className="w-24 h-24 text-gray-400" />
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              animate={isWinner ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: isWinner ? Infinity : 0 }}
              className={`text-5xl font-bold text-center mb-4 ${
                isWinner 
                  ? 'bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent'
                  : 'text-gray-300'
              }`}
            >
              {isWinner ? 'VICTOIRE !' : 'DÉFAITE'}
            </motion.h2>

            {/* Subtitle */}
            <p className="text-center text-[#D4A574] text-lg mb-8">
              {isWinner ? (
                '🎉 Félicitations ! Vous avez remporté la partie !'
              ) : (
                '💪 Ne vous découragez pas ! Retentez votre chance !'
              )}
            </p>

            {/* Result */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-8 border border-[#D4A574]/30">
              <p className="text-center text-[#F5E6D3] text-xl">
                {winner === 'white' ? '⚪ Blancs' : '⚫ Noirs'} ont gagné
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={onReplay}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-6 text-lg shadow-lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Rejouer
              </Button>
              <Button
                onClick={onHome}
                variant="outline"
                className="w-full border-[#D4A574] text-[#F5E6D3] hover:bg-white/10 py-6 text-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}