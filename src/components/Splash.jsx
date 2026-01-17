import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Splash() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center"
        >
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Logo avec animation d'entrée */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
              <motion.img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b1edfc85d95bdc82150cc/0218e90c0_ChatGPTImage17janv202613_34_32.png"
                alt="DamCash"
                className="w-32 h-32 drop-shadow-2xl"
                animate={{ 
                  rotateY: 360,
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Texte avec animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#F5E6D3] to-[#D4A574] bg-clip-text text-transparent">
                DamCash
              </h1>
              <p className="text-[#D4A574] mt-2 text-sm">Jeu de Dames en ligne</p>
            </motion.div>

            {/* Particules d'animation */}
            <motion.div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-[#D4A574] rounded-full"
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos((i / 6) * Math.PI * 2) * 150,
                    y: Math.sin((i / 6) * Math.PI * 2) * 150,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5,
                    ease: "easeOut"
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                />
              ))}
            </motion.div>

            {/* Barre de progression */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-32 h-1 bg-[#2C1810] rounded-full overflow-hidden mt-4 border border-[#D4A574]/30"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.4, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B]"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}