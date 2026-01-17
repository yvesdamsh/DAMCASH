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
  const [gameStarted, setGameStarted] = useState(false);
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

  // Recharger toutes les 2 secondes CONTINUELLEMENT pour synchroniser
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => loadData(), 2000);
    return () => clearInterval(interval);
  }, [roomId]);

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
        
        // Charger le board state depuis GameSession
        if (sess.board_state) {
          try {
            setBoardState(JSON.parse(sess.board_state));
          } catch (e) {
            console.log('Erreur parsing board_state');
          }
        }

        // Initialiser les timers à la première charge seulement
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

        // Vérifier si le jeu a démarré: player2 existe ET status est in_progress
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
      
      // SAUVEGARDER: board_state + current_turn + timestamp + timer
      const updateData = {
        board_state: JSON.stringify(newBoardState),
        current_turn: nextTurn,
        last_move_timestamp: new Date().toISOString()
      };

      // Sauvegarder le temps du joueur qui VIENT de jouer
      if (playerColor === 'white') {
        updateData.white_time = whiteTime;
      } else {
        updateData.black_time = blackTime;
      }

      // Envoyer à la base de données
      await base44.entities.GameSession.update(session.id, updateData);
      
      // Mettre à jour le state local
      setBoardState(newBoardState);
      setSession(prev => ({ ...prev, ...updateData }));
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
      <div className="p-4 border-b border-[#D4A574]/30 bg-gradient-to-b from-[#5D3A1A] to-[#2C1810]">
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

      {/* Barre Adversaire - EN HAUT */}
      {opponent && (
        <div className="bg-gradient-to-r from-[#3E2723] to-[#2C1810] border-b-2 border-[#D4A574]/40 px-6 py-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-14 h-14 border-3 border-[#D4A574]">
                <AvatarImage src={opponent.avatar_url} />
                <AvatarFallback className="bg-[#8B5A2B] text-[#F5E6D3] text-lg font-bold">
                  {opponent.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-lg text-[#F5E6D3]">{opponent.full_name}</p>
                <p className={`text-sm font-semibold ${
                  session.current_turn === (isPlayerWhite ? 'black' : 'white') 
                    ? 'text-yellow-400' 
                    : 'text-[#D4A574]'
                }`}>
                  {session.player2_id ? (
                    session.current_turn === (isPlayerWhite ? 'black' : 'white') 
                      ? 'En train de jouer...' 
                      : 'En attente'
                  ) : (
                    'En attente de rejoindre...'
                  )}
                </p>
              </div>
            </div>
            <div className={`text-4xl font-bold font-mono px-6 py-2 rounded-lg ${
              session.current_turn === (isPlayerWhite ? 'black' : 'white') 
                ? 'bg-red-500/20 border-2 border-red-500 text-red-400' 
                : 'bg-[#2C1810] border-2 border-[#D4A574]/50 text-[#F5E6D3]'
            }`}>
              {formatTime(isPlayerWhite ? blackTime : whiteTime)}
            </div>
          </div>
        </div>
      )}

      {/* Plateau de jeu */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-6 relative">
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="text-center">
              <p className="text-lg text-[#D4A574]">En attente de l'adversaire...</p>
            </div>
          </div>
        )}
        {gameType === 'chess' ? (
          <ChessBoard 
            playerColor={playerColor}
            onGameEnd={handleGameEnd}
            isMultiplayer={true}
            canMove={canMove && gameStarted}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
            blockBoard={!gameStarted}
          />
        ) : (
          <CheckersBoard 
            playerColor={playerColor}
            onGameEnd={handleGameEnd}
            isMultiplayer={true}
            canMove={canMove && gameStarted}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
            blockBoard={!gameStarted}
          />
        )}
      </div>

      {/* Barre Joueur Courant - EN BAS */}
      {user && (
        <div className="bg-gradient-to-r from-[#3E2723] to-[#2C1810] border-t-2 border-[#D4A574]/40 px-6 py-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-14 h-14 border-3 border-[#D4A574]">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-[#8B5A2B] text-[#F5E6D3] text-lg font-bold">
                  {user.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-lg text-[#F5E6D3]">{user.full_name}</p>
                <p className={`text-sm font-semibold ${
                  canMove ? 'text-lime-400' : 'text-[#D4A574]'
                }`}>
                  {canMove ? 'Votre tour' : 'En attente'}
                </p>
              </div>
            </div>
            <div className={`text-4xl font-bold font-mono px-6 py-2 rounded-lg ${
              canMove 
                ? 'bg-green-500/20 border-2 border-green-500 text-green-400' 
                : 'bg-[#2C1810] border-2 border-[#D4A574]/50 text-[#F5E6D3]'
            }`}>
              {formatTime(isPlayerWhite ? whiteTime : blackTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}