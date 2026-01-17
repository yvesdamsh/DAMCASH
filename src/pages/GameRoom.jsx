import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CheckersBoard from '../components/game/CheckersBoard';
import ChessBoard from '../components/game/ChessBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TIME_CONTROLS = {
  bullet: 60,
  blitz: 180,
  rapid: 600,
  classic: 1800,
  unlimited: null
};

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
  const [whiteTime, setWhiteTime] = useState(null);
  const [blackTime, setBlackTime] = useState(null);
  const [lastSync, setLastSync] = useState(Date.now());

  // Charger les données initiales
  useEffect(() => {
    if (roomId) {
      loadData();
    }
  }, [roomId]);

  // Recharger toutes les 2 secondes pour voir les coups adversaire
  useEffect(() => {
    if (!roomId || !gameStarted) return;
    const interval = setInterval(() => loadData(), 2000);
    return () => clearInterval(interval);
  }, [roomId, gameStarted]);

  // Timer qui décrémente chaque seconde pour le joueur dont c'est le tour
  useEffect(() => {
    if (!session || !gameStarted || session.status !== 'in_progress') return;
    if (session.time_control === 'unlimited') return;

    const timerInterval = setInterval(() => {
      const isPlayerWhite = user?.id === session.player1_id;
      const playerColor = isPlayerWhite ? 'white' : 'black';
      
      // Décrémente seulement si c'est le tour du joueur
      if (session.current_turn === playerColor) {
        const timeKey = playerColor === 'white' ? 'white_time' : 'black_time';
        const currentTime = playerColor === 'white' ? whiteTime : blackTime;
        
        if (currentTime !== null && currentTime > 0) {
          const newTime = currentTime - 1;
          
          if (playerColor === 'white') {
            setWhiteTime(newTime);
          } else {
            setBlackTime(newTime);
          }

          // Si temps écoulé, fin de partie
          if (newTime === 0) {
            handleTimeOut(playerColor);
          }
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [session, user, gameStarted, whiteTime, blackTime]);

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

        // Initialiser les timers à la première charge
        if (whiteTime === null && sess.white_time !== undefined) {
          setWhiteTime(sess.white_time);
          setBlackTime(sess.black_time);
        }

        // Charger adversaire
        const opponentId = sess.player1_id === currentUser.id ? sess.player2_id : sess.player1_id;
        if (opponentId) {
          const opponentUsers = await base44.entities.User.filter({ id: opponentId });
          if (opponentUsers.length > 0) {
            setOpponent(opponentUsers[0]);
          }
        }

        // Vérifier si le jeu a démarré (player2 connecté et game in_progress)
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
    if (!session || !user) return;
    
    try {
      const playerColor = user.id === session.player1_id ? 'white' : 'black';
      
      // Mettre à jour le temps du joueur qui vient de jouer
      const updateData = {
        board_state: JSON.stringify(newBoardState),
        current_turn: nextTurn,
        last_move_timestamp: new Date().toISOString()
      };

      if (playerColor === 'white') {
        updateData.white_time = whiteTime;
      } else {
        updateData.black_time = blackTime;
      }

      await base44.entities.GameSession.update(session.id, updateData);
      setBoardState(newBoardState);
    } catch (error) {
      console.error('Erreur sauvegarde coup:', error);
    }
  };

  const handleTimeOut = async (playerColor) => {
    if (!session) return;
    
    try {
      const winner = playerColor === 'white' ? session.player2_id : session.player1_id;
      await base44.entities.GameSession.update(session.id, {
        status: 'finished',
        winner: winner
      });
      setSession(prev => ({ ...prev, status: 'finished', winner }));
    } catch (error) {
      console.error('Erreur time out:', error);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Interface multijoueur complète
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#D4A574]/30">
        <div className="flex items-center justify-between">
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
      </div>

      {/* Joueur en haut (Adversaire) */}
      {opponent && (
        <div className="p-4 border-b border-[#D4A574]/30 bg-white/5">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={opponent.avatar_url} />
                <AvatarFallback className="bg-[#5D3A1A] text-[#F5E6D3]">
                  {opponent.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{opponent.full_name}</p>
                <p className="text-sm text-[#D4A574]">
                  {session.current_turn === (isPlayerWhite ? 'black' : 'white') ? 'En train de jouer...' : 'En attente'}
                </p>
              </div>
            </div>
            <div className={`text-3xl font-bold font-mono ${
              session.current_turn === (isPlayerWhite ? 'black' : 'white') ? 'text-red-400' : 'text-[#D4A574]'
            }`}>
              {formatTime(isPlayerWhite ? blackTime : whiteTime)}
            </div>
          </div>
        </div>
      )}

      {/* Plateau de jeu */}
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

      {/* Joueur en bas (Courant) */}
      {user && (
        <div className="p-4 border-t border-[#D4A574]/30 bg-white/5">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-[#5D3A1A] text-[#F5E6D3]">
                  {user.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-sm text-[#D4A574]">
                  {canMove ? 'Votre tour' : 'En attente'}
                </p>
              </div>
            </div>
            <div className={`text-3xl font-bold font-mono ${
              canMove ? 'text-green-400' : 'text-[#D4A574]'
            }`}>
              {formatTime(isPlayerWhite ? whiteTime : blackTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}