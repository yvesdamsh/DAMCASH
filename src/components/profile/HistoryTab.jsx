import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye } from 'lucide-react';

export default function HistoryTab({ user }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadGameHistory();
  }, [user]);

  const loadGameHistory = async () => {
    try {
      setLoading(true);
      const results = await base44.entities.GameResult.filter(
        {},
        '-created_date',
        10
      );

      const userGames = results.filter(
        g => g.player1_id === user.id || g.player2_id === user.id
      );

      setGames(userGames);
    } catch (e) {
      console.error('Erreur chargement historique:', e);
    } finally {
      setLoading(false);
    }
  };

  const getResult = (game) => {
    if (game.result === 'draw') return { text: 'Nulle', color: 'bg-purple-500/20 text-purple-400', icon: '🤝' };
    
    const isPlayer1Winner = game.winner_id === game.player1_id;
    const isCurrentUserPlayer1 = user.id === game.player1_id;
    const userWon = isPlayer1Winner === isCurrentUserPlayer1;

    return userWon 
      ? { text: 'Victoire', color: 'bg-green-500/20 text-green-400', icon: '🏆' }
      : { text: 'Défaite', color: 'bg-red-500/20 text-red-400', icon: '💔' };
  };

  const getOpponentInfo = (game) => {
    const isPlayer1 = user.id === game.player1_id;
    return {
      name: isPlayer1 ? game.player2_name : game.player1_name,
      id: isPlayer1 ? game.player2_id : game.player1_id
    };
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4A574]"></div>
        </div>
      ) : games.length === 0 ? (
        <p className="text-center text-[#D4A574]/50 py-8">Aucune partie trouvée</p>
      ) : (
        <ScrollArea className="h-[600px]">
          {games.map((game, idx) => {
            const result = getResult(game);
            const opponent = getOpponentInfo(game);
            const gameDate = format(new Date(game.created_date), 'dd MMM yyyy HH:mm', { locale: fr });

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 border border-[#D4A574]/20 rounded-lg p-4 mb-3 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-[#8B5A2B] text-xs">{opponent.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{opponent.name}</p>
                      <p className="text-xs text-[#D4A574]/70">{gameDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge className={`${result.color} border-0`}>
                        {result.icon} {result.text}
                      </Badge>
                      <p className="text-xs text-[#D4A574]/70 mt-1">
                        {game.game_type === 'chess' ? '♔ Échecs' : '⚫ Dames'} • {game.time_control || 'Classic'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#D4A574]/30 text-[#D4A574] hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}