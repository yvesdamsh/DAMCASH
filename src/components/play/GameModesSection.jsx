import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function GameModesSection() {
  const modes = [
    {
      id: 'bullet',
      title: 'Rapide',
      emoji: '⚡',
      time: '1 min par joueur',
      subtitle: 'Action intense',
      isNew: true,
      color: 'from-red-600 to-orange-600'
    },
    {
      id: 'blitz',
      title: 'Blitz',
      emoji: '🔥',
      time: '3-5 min par joueur',
      subtitle: 'Réflexion rapide',
      color: 'from-orange-600 to-amber-600'
    },
    {
      id: 'ranked',
      title: 'Classement',
      emoji: '🏆',
      time: 'Partie classée',
      subtitle: 'Gagne des points ELO',
      isCompetitive: true,
      color: 'from-purple-600 to-pink-600'
    },
    {
      id: 'friendly',
      title: 'Amical',
      emoji: '🤝',
      time: 'Sans classement',
      subtitle: 'Pour le plaisir',
      color: 'from-blue-600 to-cyan-600'
    }
  ];

  return (
    <div className="mb-12">
      <h2 className="text-3xl md:text-4xl font-black text-[#F5E6D3] mb-2">
        🎮 Modes de jeu disponibles
      </h2>
      <p className="text-[#D4A574] text-lg mb-8">Choisissez votre style de jeu préféré</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modes.map((mode, idx) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ translateY: -8 }}
            className="relative group"
          >
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${mode.color} border border-white/20 hover:border-white/40 transition-all backdrop-blur-sm p-6 h-full hover:shadow-xl`}>
              {/* Content */}
              <div className="relative z-10">
                <div className="text-5xl mb-3">{mode.emoji}</div>
                <h3 className="text-2xl font-bold text-white mb-1">{mode.title}</h3>
                <p className="text-white/80 text-sm font-semibold mb-3">{mode.time}</p>
                <p className="text-white/70 text-sm">{mode.subtitle}</p>

                {/* Badges */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {mode.isNew && (
                    <Badge className="bg-green-500 text-black font-bold text-xs">NOUVEAU</Badge>
                  )}
                  {mode.isCompetitive && (
                    <Badge className="bg-purple-500 text-white font-bold text-xs">COMPÉTITIF</Badge>
                  )}
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/20 to-transparent" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}