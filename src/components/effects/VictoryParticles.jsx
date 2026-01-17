import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VictoryParticles({ show, winner }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      const newParticles = [...Array(50)].map((_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        duration: Math.random() * 2 + 2,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute"
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 1,
                rotate: particle.rotation,
                scale: particle.scale,
              }}
              animate={{
                y: -100,
                x: particle.x + (Math.random() - 0.5) * 200,
                rotate: particle.rotation + 360,
                opacity: 0,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut",
              }}
            >
              {Math.random() > 0.5 ? (
                <div className="text-2xl">🏆</div>
              ) : (
                <div className="text-2xl">⭐</div>
              )}
            </motion.div>
          ))}

          {/* Victory message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <motion.h2
              className="text-4xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Victoire !
            </motion.h2>
            <p className="text-xl text-white mt-2">
              {winner === 'white' ? '⚪ Blancs' : '⚫ Noirs'} gagnent
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}