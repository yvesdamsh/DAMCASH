import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Calendar, Eye, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function History() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Récupérer toutes les parties où l'utilisateur a joué
      const allGames = await base44.entities.GameResult.list('-created_date');
      const userGames = allGames.filter(
        (g) => g.player1_id === currentUser.id || g.player2_id === currentUser.id
      );

      setGames(userGames);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOpponentName = (game) => {
    if (!user) return 'Adversaire';
    return game.player1_id === user.id ? game.player2_name : game.player1_name;
  };

  const getGameResult = (game) => {
    if (!user) return null;
    
    const isPlayer1 = game.player1_id === user.id;
    
    if (game.result === 'draw') {
      return { text: 'Match nul', color: 'text-yellow-400', icon: '🤝' };
    }
    
    const userWon = 
      (isPlayer1 && game.result === 'white') || 
      (!isPlayer1 && game.result === 'black') ||
      (game.winner_id === user.id);
    
    if (userWon) {
      return { text: 'Victoire', color: 'text-green-400', icon: '🏆' };
    } else {
      return { text: 'Défaite', color: 'text-red-400', icon: '❌' };
    }
  };

  const handleReviewGame = (game) => {
    // Créer une session de revue (readonly)
    navigate(`/ReviewGame?resultId=${game.id}`);
  };

  const filteredGames = games.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'chess') return g.game_type === 'chess';
    if (filter === 'checkers') return g.game_type === 'checkers';
    if (filter === 'wins') {
      const result = getGameResult(g);
      return result && result.text === 'Victoire';
    }
    if (filter === 'losses') {
      const result = getGameResult(g);
      return result && result.text === 'Défaite';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/Profile')}
              variant="ghost"
              className="text-[#F5E6D3] hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold">📜 Historique des parties</h1>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'chess', label: '♔ Échecs' },
            { value: 'checkers', label: '⚫ Dames' },
            { value: 'wins', label: '🏆 Victoires' },
            { value: 'losses', label: '❌ Défaites' }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === f.value
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#5D3A1A] text-[#D4A574] hover:bg-[#6D4A2A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#5D3A1A]/50 border border-[#D4A574]/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {games.filter(g => getGameResult(g)?.text === 'Victoire').length}
            </p>
            <p className="text-sm text-[#D4A574]">Victoires</p>
          </div>
          <div className="bg-[#5D3A1A]/50 border border-[#D4A574]/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">
              {games.filter(g => getGameResult(g)?.text === 'Défaite').length}
            </p>
            <p className="text-sm text-[#D4A574]">Défaites</p>
          </div>
          <div className="bg-[#5D3A1A]/50 border border-[#D4A574]/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {games.filter(g => g.result === 'draw').length}
            </p>
            <p className="text-sm text-[#D4A574]">Nuls</p>
          </div>
        </div>

        {/* Liste des parties */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredGames.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#D4A574]/70 text-lg">Aucune partie trouvée</p>
              </div>
            ) : (
              filteredGames.map((game, index) => {
                const result = getGameResult(game);
                const opponent = getOpponentName(game);
                
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#5D3A1A]/50 backdrop-blur-lg border border-[#D4A574]/30 rounded-lg p-4 hover:bg-[#5D3A1A]/70 hover:border-[#D4A574]/50 transition-all shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-4xl">
                          {game.game_type === 'chess' ? '♔' : '⚫'}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-[#F5E6D3]">
                              vs {opponent}
                            </h3>
                            <span className={`text-sm font-semibold ${result?.color}`}>
                              {result?.icon} {result?.text}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-[#D4A574]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(game.created_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </span>
                            {game.moves_count && (
                              <span>{game.moves_count} coups</span>
                            )}
                            {game.duration_seconds && (
                              <span>
                                {Math.floor(game.duration_seconds / 60)}m {game.duration_seconds % 60}s
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleReviewGame(game)}
                        variant="outline"
                        className="border-[#D4A574]/50 text-[#F5E6D3] hover:bg-white/5"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Revoir
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}