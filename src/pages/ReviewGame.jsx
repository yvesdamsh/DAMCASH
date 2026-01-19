import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ChessBoard from '../components/game/ChessBoard';
import CheckersBoard from '../components/game/CheckersBoard';

export default function ReviewGame() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const resultId = urlParams.get('resultId');
  
  const [gameResult, setGameResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGame();
  }, [resultId]);

  const loadGame = async () => {
    try {
      const results = await base44.entities.GameResult.filter({ id: resultId });
      if (results.length > 0) {
        setGameResult(results[0]);
      }
    } catch (error) {
      console.error('Erreur chargement partie:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <p className="text-xl">Partie introuvable</p>
        <Button onClick={() => navigate('/History')} className="bg-amber-600 hover:bg-amber-700">
          Retour à l'historique
        </Button>
      </div>
    );
  }

  const boardState = gameResult.final_board_state ? JSON.parse(gameResult.final_board_state) : null;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#D4A574]/30 bg-gradient-to-b from-[#5D3A1A] to-[#2C1810]">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/History')}
            className="text-[#F5E6D3] hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {gameResult.game_type === 'chess' ? '♔ Revue - Échecs' : '⚫ Revue - Dames'}
            </h1>
            <p className="text-sm text-[#D4A574]">
              {gameResult.player1_name} vs {gameResult.player2_name}
            </p>
          </div>
          <div className="w-20" />
        </div>
      </div>

      {/* Résultat */}
      <div className="px-6 py-4 bg-[#5D3A1A]/30 border-b border-[#D4A574]/30">
        <div className="text-center">
          <p className="text-lg">
            Résultat: {' '}
            <span className={`font-bold ${
              gameResult.result === 'draw' 
                ? 'text-yellow-400' 
                : gameResult.result === 'white' 
                  ? 'text-green-400' 
                  : 'text-red-400'
            }`}>
              {gameResult.result === 'draw' ? '🤝 Match nul' : 
               gameResult.result === 'white' ? `🏆 ${gameResult.player1_name} (Blancs)` : 
               `🏆 ${gameResult.player2_name} (Noirs)`}
            </span>
          </p>
        </div>
      </div>

      {/* Plateau de jeu */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-6">
        {boardState ? (
          gameResult.game_type === 'chess' ? (
            <ChessBoard 
              playerColor="white"
              initialBoardState={boardState}
              blockBoard={true}
              canMove={false}
            />
          ) : (
            <CheckersBoard 
              playerColor="white"
              initialBoardState={boardState}
              blockBoard={true}
              canMove={false}
            />
          )
        ) : (
          <p className="text-[#D4A574]">État du plateau non disponible</p>
        )}
      </div>
    </div>
  );
}