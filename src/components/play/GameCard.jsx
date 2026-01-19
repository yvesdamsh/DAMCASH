import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function GameCard({ game, isPopular }) {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const sessions = await base44.entities.GameSession.filter({ 
          game_type: game.gameType,
          status: 'in_progress'
        });
        setPlayerCount(sessions?.length * 2 || 0);
      } catch (e) {
        console.log('Stats load failed');
      }
    };

    loadStats();
  }, [game.gameType]);

  const handlePlayNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(createPageUrl('RoomLobby') + `?game=${game.gameType}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative group h-full"
    >
      <div className="block h-full">
        <div className={`relative h-full rounded-3xl overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all backdrop-blur-sm shadow-xl hover:shadow-2xl cursor-pointer group`}>
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`} />
          
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: game.pattern,
            backgroundSize: '30px 30px'
          }} />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2">
                  {game.title}
                </h2>
                <p className="text-white/90 text-base md:text-lg">{game.description}</p>
              </div>
              {isPopular && (
                <Badge className="bg-yellow-500 text-black font-bold text-sm px-3 py-1">
                  🔥 POPULAIRE
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex-1 flex flex-col justify-between mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm">Difficulté: <span className="font-bold">{game.difficulty}</span></span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-lg">👥</span>
                  <span className="text-sm">{playerCount || game.defaultPlayers} joueurs actifs</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-lg">💎</span>
                  <span className="text-sm">Gains: <span className="font-bold">{game.rewards}</span></span>
                </div>
              </div>
            </div>

            {/* Button */}
            <Button 
              onClick={handlePlayNow}
              className={`w-full font-bold text-lg py-6 ${game.buttonClass} group-hover:shadow-lg group-hover:shadow-orange-500/50 transition-all hover:scale-105`}
            >
              🎮 Jouer maintenant
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Button>
          </div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-20`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}