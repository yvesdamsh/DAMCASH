import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CheckersBoard from '../components/game/CheckersBoard';
import ChessBoard from '../components/game/ChessBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';

export default function GameRoom() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  const isWaiting = urlParams.get('waiting') === 'true';
  
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(isWaiting !== 'true');
  const [opponent, setOpponent] = useState(null);
  const [boardState, setBoardState] = useState(null);

  useEffect(() => {
    if (roomId) {
      loadData();
      // Rafraîchir toutes les 2 secondes (même quand jeu actif pour voir les coups adversaire)
      const interval = setInterval(loadData, 2000);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const sessions = await base44.entities.GameSession.filter({
        room_id: roomId
      });

      if (sessions.length > 0) {
        const sess = sessions[0];
        setSession(sess);
        
        if (sess.board_state) {
          setBoardState(JSON.parse(sess.board_state));
        }

        // Charger adversaire
        const opponentId = sess.player1_id === currentUser.id ? sess.player2_id : sess.player1_id;
        if (opponentId) {
          const opponentUsers = await base44.entities.User.filter({ id: opponentId });
          if (opponentUsers.length > 0) {
            setOpponent(opponentUsers[0]);
          }
        }

        // Vérifier si le jeu a démarré (player2 connecté)
        if (sess.status === 'in_progress' && sess.player2_id) {
          setGameStarted(true);
        }
      }
    } catch (error) {
      console.error('Error loading game room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMove = async (newBoardState, nextTurn) => {
    if (!session) return;
    
    try {
      await base44.entities.GameSession.update(session.id, {
        board_state: JSON.stringify(newBoardState),
        current_turn: nextTurn
      });
      setBoardState(newBoardState);
    } catch (error) {
      console.error('Erreur sauvegarde coup:', error);
    }
  };

  const handleGameEnd = () => {
    navigate('/Play');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <p className="text-xl">Jeu introuvable</p>
        <Button onClick={() => navigate('/Play')} className="bg-amber-600 hover:bg-amber-700">
          Retour
        </Button>
      </div>
    );
  }

  const isPlayerWhite = user && session && user.id === session.player1_id;
  const playerColor = isPlayerWhite ? 'white' : 'black';
  const gameType = session?.game_type;
  const canMove = (playerColor === 'white' && session.current_turn === 'white') || 
                  (playerColor === 'black' && session.current_turn === 'black');

  // Écran d'attente
  if (!gameStarted) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">En attente...</h1>
          <p className="text-lg text-[#D4A574] mb-4">
            {opponent ? `Attente de ${opponent.full_name}` : 'Attente de l\'adversaire'}
          </p>
          <div className="flex items-center justify-center gap-2 text-[#D4A574]">
            <Clock className="w-5 h-5 animate-spin" />
            <span>La partie commencera une fois que l'adversaire accepte</span>
          </div>
        </div>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
        <Button
          onClick={() => navigate('/Search')}
          variant="outline"
          className="mt-8 border-[#D4A574]/30 text-[#F5E6D3] hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-[#D4A574]/30">
        <Button
          variant="ghost"
          onClick={() => navigate('/Play')}
          className="text-[#F5E6D3] hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">
          {gameType === 'chess' ? '♔ Échecs' : '⚫ Dames'}
        </h1>
        <div className="w-20" />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {gameType === 'chess' ? (
          <ChessBoard 
            playerColor={playerColor}
            onGameEnd={handleGameEnd}
            isMultiplayer={true}
            canMove={canMove}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
          />
        ) : (
          <CheckersBoard 
            playerColor={playerColor}
            onGameEnd={handleGameEnd}
            isMultiplayer={true}
            canMove={canMove}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
          />
        )}
      </div>
    </div>
  );
}