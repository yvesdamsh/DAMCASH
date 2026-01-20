import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Activity, Eye, Gem, ChevronRight } from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';

export default function Colisee() {
  const [liveGames, setLiveGames] = useState([]);

  useEffect(() => {
    loadLiveGames();
    const interval = setInterval(loadLiveGames, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveGames = async () => {
    try {
      // Récupérer les parties en cours avec le plus de spectateurs
      const sessions = await base44.entities.GameSession.filter({ status: 'in_progress' }, '-created_date', 2);
      
      if (sessions.length > 0) {
        // Enrichir avec les données utilisateur
        const enrichedGames = await Promise.all(
          sessions.map(async (session) => {
            try {
              const player1 = await base44.entities.User.filter({ id: session.player1_id }, '-created_date', 1);
              const player2 = await base44.entities.User.filter({ id: session.player2_id }, '-created_date', 1);
              return {
                ...session,
                player1_data: player1[0] || { full_name: session.player1_name, chess_rating: 1200 },
                player2_data: player2[0] || { full_name: session.player2_name, chess_rating: 1200 },
                spectators: Math.floor(Math.random() * 100) + 20 // Mock spectateurs
              };
            } catch (e) {
              return {
                ...session,
                player1_data: { full_name: session.player1_name, chess_rating: 1200 },
                player2_data: { full_name: session.player2_name, chess_rating: 1200 },
                spectators: Math.floor(Math.random() * 100) + 20
              };
            }
          })
        );
        setLiveGames(enrichedGames);
      } else {
        setLiveGames(mockGames);
      }
    } catch (e) {
      setLiveGames(mockGames);
    }
  };

  const mockGames = [
    {
      id: '1',
      room_id: 'mock1',
      game_type: 'checkers',
      player1_data: { full_name: 'DAMALEGEND', chess_rating: 2100 },
      player2_data: { full_name: 'STRATEGYKING', chess_rating: 2100 },
      spectators: 85,
      prize: 250
    },
    {
      id: '2',
      room_id: 'mock2',
      game_type: 'checkers',
      player1_data: { full_name: 'SLIDERPRO', chess_rating: 1950 },
      player2_data: { full_name: 'CHECKERSCHAMP', chess_rating: 1920 },
      spectators: 45,
      prize: 150
    }
  ];

  if (liveGames.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="border-l-4 border-[#D4A574] pl-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-6 h-6 text-[#D4A574]" />
          <h2 className="text-2xl font-bold text-[#F5E6D3]">LE COLISÉE</h2>
        </div>
        <p className="text-sm text-[#D4A574]">Parties les plus suivies en temps réel</p>
      </div>

      {/* Live Games */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveGames.map((game) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#2C1810] to-[#1a0f0f] border border-[#D4A574]/30 rounded-lg overflow-hidden hover:border-[#D4A574]/60 transition-all group"
          >
            {/* Live Badge & Spectators */}
            <div className="bg-[#1a0f0f] px-4 py-2 flex items-center justify-between border-b border-[#D4A574]/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-red-500 uppercase">LIVE</span>
                <span className="text-xs text-[#D4A574]">• {game.spectators} SPECTATEURS</span>
              </div>
            </div>

            <div className="p-4">
              {/* Miniature plateau (mockup) */}
              <div className="aspect-square bg-[#8B5A2B] rounded-lg mb-4 relative overflow-hidden border border-[#D4A574]/20">
                {/* Pattern damier simplifié */}
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        (Math.floor(i / 8) + i) % 2 === 0
                          ? 'bg-[#5D3A1A]'
                          : 'bg-[#2C1810]'
                      }`}
                    />
                  ))}
                </div>
                {/* Overlay pour effet professionnel */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0f]/60 to-transparent pointer-events-none"></div>
              </div>

              {/* Players */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <UserAvatar user={{ full_name: game.player1_data.full_name }} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-[#F5E6D3]">
                        {game.player1_data.full_name}
                      </p>
                      <p className="text-xs text-[#D4A574]">
                        {game.player1_data.chess_rating || game.player1_data.checkers_rating || 1200} ELO
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <UserAvatar user={{ full_name: game.player2_data.full_name }} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-[#F5E6D3]">
                        {game.player2_data.full_name}
                      </p>
                      <p className="text-xs text-[#D4A574]">
                        {game.player2_data.chess_rating || game.player2_data.checkers_rating || 1200} ELO
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prize & Watch */}
              <div className="flex items-center justify-between pt-3 border-t border-[#D4A574]/20">
                {game.prize && (
                  <div className="flex items-center gap-1 text-[#D4A574]">
                    <Gem className="w-4 h-4" />
                    <span className="text-sm font-bold">D$ {game.prize}</span>
                  </div>
                )}
                <Link to={createPageUrl('GameRoom', `?roomId=${game.room_id}`)}>
                  <button className="flex items-center gap-1 text-[#F5E6D3] hover:text-[#D4A574] text-sm font-semibold transition-colors">
                    <Eye className="w-4 h-4" />
                    Regarder
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      <Link 
        to={createPageUrl('Spectate')}
        className="flex items-center justify-center gap-2 text-[#D4A574] hover:text-[#F5E6D3] font-semibold mt-4 transition-colors"
      >
        Toute l'arène
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}