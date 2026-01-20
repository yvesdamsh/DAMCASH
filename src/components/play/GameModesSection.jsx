import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Loader } from 'lucide-react';

export default function GameModesSection({ gameType }) {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const modes = [
    {
      id: 'bullet',
      title: 'Rapide',
      emoji: '⚡',
      time: '1 min par joueur',
      subtitle: 'Action intense',
      isNew: true,
      color: 'from-red-600 to-orange-600',
      bgImage: 'linear-gradient(135deg, rgba(220, 38, 38, 0.6) 0%, rgba(234, 88, 12, 0.6) 100%)',
      pattern: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
      timeControl: 'bullet'
    },
    {
      id: 'blitz',
      title: 'Blitz',
      emoji: '🔥',
      time: '3-5 min par joueur',
      subtitle: 'Réflexion rapide',
      color: 'from-orange-600 to-amber-600',
      bgImage: 'linear-gradient(135deg, rgba(234, 88, 12, 0.7) 0%, rgba(251, 146, 60, 0.7) 100%)',
      pattern: 'conic-gradient(from 0deg at 50% 50%, rgba(255, 255, 255, 0.15) 0deg, transparent 90deg)',
      timeControl: 'blitz'
    },
    {
      id: 'ranked',
      title: 'Classement',
      emoji: '🏆',
      time: 'Partie classée',
      subtitle: 'Gagne des points ELO',
      isCompetitive: true,
      color: 'from-purple-600 to-pink-600',
      bgImage: 'linear-gradient(135deg, rgba(147, 51, 234, 0.6) 0%, rgba(219, 39, 119, 0.6) 100%)',
      pattern: 'radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.15) 20%, transparent 70%)',
      timeControl: 'classic'
    },
    {
      id: 'friendly',
      title: 'Amical',
      emoji: '🤝',
      time: 'Sans classement',
      subtitle: 'Pour le plaisir',
      color: 'from-blue-600 to-cyan-600',
      bgImage: 'linear-gradient(135deg, rgba(37, 99, 235, 0.6) 0%, rgba(6, 182, 212, 0.6) 100%)',
      pattern: 'radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 2px, transparent 2px)',
      timeControl: 'rapid'
    }
  ];

  const handleSelectMode = async (mode) => {
    setSelectedMode(mode.id);
    setIsSearching(true);
    
    // Simulate searching for opponent, then redirect
    setTimeout(() => {
      navigate(createPageUrl('RoomLobby') + `?timeControl=${mode.timeControl}`);
    }, 1500);
  };

  return (
    <div className="mb-12">
      <div className="border-l-4 border-[#D4A574] pl-6 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#F5E6D3] mb-2">
          Modes de jeu
        </h2>
        <p className="text-[#D4A574] text-lg">Choisissez votre style de jeu préféré</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modes.map((mode, idx) => {
          const isSelected = selectedMode === mode.id;
          const isCurrentlySearching = isSelected && isSearching;
          
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={!isCurrentlySearching ? { translateY: -8, scale: 1.02 } : {}}
              onClick={() => !isCurrentlySearching && handleSelectMode(mode)}
              className="relative group cursor-pointer"
            >
              <div className={`relative overflow-hidden rounded-lg border transition-all p-6 h-full bg-gradient-to-br from-[#2C1810] to-[#5D3A1A]
                ${isSelected 
                  ? 'border-[#D4A574] shadow-lg shadow-[#D4A574]/20' 
                  : 'border-[#D4A574]/30 hover:border-[#D4A574]/60'
                }`}>
                
                {/* Subtle background */}
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #D4A574 1px, transparent 0)',
                  backgroundSize: '30px 30px'
                }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl opacity-60">{mode.emoji}</div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-[#D4A574] flex items-center justify-center"
                      >
                        {isCurrentlySearching ? (
                          <Loader className="w-4 h-4 text-[#2C1810] animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 text-[#2C1810] font-bold" />
                        )}
                      </motion.div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-[#F5E6D3] mb-2">{mode.title}</h3>
                  <p className="text-[#D4A574] text-sm mb-2">{mode.time}</p>
                  <p className="text-[#F5E6D3]/70 text-sm flex-1">{mode.subtitle}</p>

                  {/* Badges */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {mode.isNew && (
                      <Badge className="bg-[#D4A574] text-[#2C1810] font-bold text-xs">NOUVEAU</Badge>
                    )}
                    {mode.isCompetitive && (
                      <Badge className="bg-[#8B5A2B] text-[#F5E6D3] font-bold text-xs">COMPÉTITIF</Badge>
                    )}
                  </div>

                  {/* Action button */}
                  {isCurrentlySearching && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 text-center text-sm text-[#D4A574] font-semibold"
                    >
                      Recherche en cours...
                    </motion.div>
                  )}
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-[#D4A574] rounded-lg" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}