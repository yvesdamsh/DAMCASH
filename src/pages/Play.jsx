import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Crown, Circle, ArrowRight } from 'lucide-react';

export default function Play() {
  const games = [
    {
      id: 'chess',
      name: 'Échecs',
      description: 'Le jeu de stratégie classique',
      icon: <Crown className="w-8 h-8" />,
      page: 'Chess',
      gradient: 'from-amber-600 to-amber-800',
      iconColor: 'text-amber-300'
    },
    {
      id: 'checkers',
      name: 'Dames Internationales',
      description: 'Jeu de dames sur plateau 10x10',
      icon: <Circle className="w-8 h-8" />,
      page: 'Checkers',
      gradient: 'from-blue-600 to-blue-800',
      iconColor: 'text-blue-300'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Choisir un jeu</h1>
      
      <div className="space-y-4">
        {games.map((game) => (
          <Link
            key={game.id}
            to={createPageUrl(game.page)}
            className="block group"
          >
            <div className={`p-6 rounded-2xl bg-gradient-to-r ${game.gradient} border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] hover:shadow-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center ${game.iconColor}`}>
                    {game.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{game.name}</h2>
                    <p className="text-sm text-white/70">{game.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}