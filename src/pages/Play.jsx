import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Crown, Circle, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Play() {
  const modes = [
    {
      id: 'solo',
      name: 'Jouer seul',
      description: 'Affrontez l\'IA',
      icon: <Circle className="w-8 h-8" />,
      gradient: 'from-purple-600 to-purple-800',
      iconColor: 'text-purple-300',
      action: null
    },
    {
      id: 'multiplayer',
      name: 'Multijoueur',
      description: 'Rejoignez des salons en ligne',
      icon: <Users className="w-8 h-8" />,
      gradient: 'from-green-600 to-green-800',
      iconColor: 'text-green-300',
      action: 'RoomLobby'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-[#F5E6D3] mb-2">Mode de jeu</h1>
      <p className="text-[#D4A574] mb-8">Choisissez comment vous voulez jouer</p>
      
      <div className="space-y-4 mb-8">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className={`p-6 rounded-2xl bg-gradient-to-r ${mode.gradient} border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] hover:shadow-2xl backdrop-blur-lg shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center ${mode.iconColor}`}>
                  {mode.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{mode.name}</h2>
                  <p className="text-sm text-white/70">{mode.description}</p>
                </div>
              </div>
              {mode.action && (
                <Link to={createPageUrl(mode.action)}>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
                    Accéder
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-[#F5E6D3] mb-4">Choisir un jeu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: 'Échecs',
              icon: Crown,
              page: 'Chess',
              color: 'from-amber-600 to-amber-800',
              iconColor: 'text-amber-300'
            },
            {
              name: 'Dames',
              icon: Circle,
              page: 'Checkers',
              color: 'from-blue-600 to-blue-800',
              iconColor: 'text-blue-300'
            }
          ].map((game) => (
            <Link
              key={game.page}
              to={createPageUrl(game.page)}
              className="block group"
            >
              <div className={`p-6 rounded-2xl bg-gradient-to-r ${game.color} border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] hover:shadow-xl backdrop-blur-lg shadow-lg`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center ${game.iconColor}`}>
                    <game.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{game.name}</h3>
                  <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}