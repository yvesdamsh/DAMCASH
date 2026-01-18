import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CheckersBoard from '../components/game/CheckersBoard';
import ChessBoard from '../components/game/ChessBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const isSpectator = urlParams.get('spectate') === 'true';
  
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [boardState, setBoardState] = useState(null);
  const [whiteTime, setWhiteTime] = useState(null);
  const [blackTime, setBlackTime] = useState(null);
  const [lastSync, setLastSync] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const endGameSentRef = useRef(false);
  const spectatorJoinedRef = useRef(false);

  // Charger les données initiales
  useEffect(() => {
    if (roomId) {
      loadData();
    }
  }, [roomId]);

  // Fallback: recharger périodiquement si le realtime se coupe
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => loadData(), 15000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Realtime: écouter les changements de GameSession pour les jointures de joueur
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = base44.entities.GameSession.subscribe(async (event) => {
      if (!event?.data) return;
      const matchesRoom = event.data.room_id === roomId;
      if (!matchesRoom) return;

      const sess = event.data;

      // Mettre à jour la session
      setSession(prev => ({ ...prev, ...sess }));

      // Démarrer la partie quand player2_id est présent
      setGameStarted(!!sess.player2_id || sess.status === 'in_progress');

      // Rafraîchir l'adversaire si nécessaire
      const opponentId = user?.id === sess.player1_id ? sess.player2_id : sess.player1_id;
      if (opponentId && opponent?.id !== opponentId) {
        const onlineUsers = await base44.entities.OnlineUser.filter({ user_id: opponentId });
        if (onlineUsers.length > 0) {
          setOpponent({
            id: opponentId,
            full_name: onlineUsers[0].username || sess.player2_name || sess.invited_player_name,
            avatar_url: onlineUsers[0].avatar_url
          });
        } else {
          setOpponent({
            id: opponentId,
            full_name: sess.player2_name || sess.invited_player_name || 'Adversaire',
            avatar_url: null
          });
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomId, user?.id, opponent?.id]);

  // Realtime dédié aux coups: écouter les changements de GameSession pour la synchro board
  useEffect(() => {
    if (!roomId || !session?.id) return;

    // Subscription realtime ACTIVE sur GameSession pour synchroniser le board_state
    const unsubscribe = base44.entities.GameSession.subscribe((event) => {
      if (!event?.data) return;

      // Vérifier que c'est bien notre session
      const isOurSession = event.data.id === session.id || event.data.room_id === roomId;
      if (!isOurSession) return;

      const updatedSession = event.data;

      // Synchroniser le board_state immédiatement
      if (updatedSession.board_state) {
        try {
          setBoardState(JSON.parse(updatedSession.board_state));
        } catch (e) {
          console.log('Erreur parsing board_state');
        }
      }

      // Synchroniser les timers
      if (typeof updatedSession.white_time !== 'undefined') {
        setWhiteTime(updatedSession.white_time);
      }
      if (typeof updatedSession.black_time !== 'undefined') {
        setBlackTime(updatedSession.black_time);
      }

      // Synchroniser le tour et le statut
      if (updatedSession.current_turn) {
        setSession(prev => ({ 
          ...prev, 
          current_turn: updatedSession.current_turn,
          last_move_timestamp: updatedSession.last_move_timestamp
        }));
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomId, session?.id]);

  // Chat: charger + realtime messages
  useEffect(() => {
    if (!roomId) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const data = await base44.entities.GameChatMessage.filter(
          { room_id: roomId },
          'created_date'
        );
        setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log('Erreur chargement chat:', e?.message || e);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    // Subscription realtime ACTIVE pour chaque nouveau message
    const unsubscribe = base44.entities.GameChatMessage.subscribe((event) => {
      if (event?.type !== 'create') return;
      if (!event?.data || event.data.room_id !== roomId) return;
      setMessages(prev => {
        const exists = prev.some(m => m.id === event.data.id);
        if (exists) return prev;
        return [...prev, event.data];
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomId]);

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !user || !roomId) return;
    if (isSpectator) return;

    try {
      // Créer le message - le realtime subscription le récupérera automatiquement
      await base44.entities.GameChatMessage.create({
        room_id: roomId,
        sender_id: user.id,
        sender_name: user.full_name,
        message: text
      });
      setNewMessage('');
    } catch (e) {
      console.log('Erreur envoi chat:', e?.message || e);
    }
  };

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
        let sess = sessions[0];
        
        // Si l'utilisateur courant n'est pas player1 et player2_id est vide
        // Alors c'est player2 qui rejoint - mettre à jour immédiatement
        if (!isSpectator && sess.player1_id !== currentUser.id && !sess.player2_id) {
          await base44.entities.GameSession.update(sess.id, {
            player2_id: currentUser.id,
            player2_email: currentUser.email,
            player2_name: currentUser.full_name,
            status: 'in_progress',
            current_turn: 'white'
          });
          // Marquer l'invitation comme acceptée si elle existe
          try {
            const invites = await base44.entities.GameInvitation.filter({
              room_id: roomId,
              receiver_id: currentUser.id,
              status: 'pending'
            });
            if (invites.length > 0) {
              await base44.entities.GameInvitation.update(invites[0].id, { status: 'accepted' });
            }
          } catch (e) {
            console.log('Invitation update failed:', e?.message || e);
          }
          // Recharger la session après update
          const updatedSessions = await base44.entities.GameSession.filter({
            room_id: roomId
          });
          sess = updatedSessions[0];
        }
        
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

        // Charger adversaire (sans accès User)
        const opponentId = sess.player1_id === currentUser.id ? sess.player2_id : sess.player1_id;
        if (opponentId) {
          const onlineUsers = await base44.entities.OnlineUser.filter({ user_id: opponentId });
          if (onlineUsers.length > 0) {
            setOpponent({
              id: opponentId,
              full_name: onlineUsers[0].username || sess.player2_name || sess.invited_player_name,
              avatar_url: onlineUsers[0].avatar_url
            });
          } else {
            setOpponent({
              id: opponentId,
              full_name: sess.player2_name || sess.invited_player_name || 'Adversaire',
              avatar_url: null
            });
          }
        } else if (sess.invited_player_name) {
          setOpponent({
            id: sess.invited_player_id || null,
            full_name: sess.invited_player_name,
            avatar_url: null
          });
        }

        // Vérifier si le jeu a démarré: player2_id existe
        // Dès que player2_id est rempli, le jeu commence pour les deux joueurs
        setGameStarted(!!sess.player2_id || sess.status === 'in_progress');
      }
    } catch (error) {
      console.error('Error loading game room:', error);
    } finally {
      setLoading(false);
    }
  };

  // Spectateur: incrémenter/décrémenter le compteur
  useEffect(() => {
    if (!isSpectator || !roomId) return;

    const updateSpectators = async (delta) => {
      try {
        const sessions = await base44.entities.GameSession.filter({ room_id: roomId });
        if (sessions.length === 0) return;
        const sess = sessions[0];
        const nextCount = Math.max(0, (sess.spectators_count || 0) + delta);
        await base44.entities.GameSession.update(sess.id, { spectators_count: nextCount });
      } catch (e) {
        console.log('Erreur spectators_count:', e?.message || e);
      }
    };

    if (!spectatorJoinedRef.current) {
      spectatorJoinedRef.current = true;
      updateSpectators(1);
    }

    return () => {
      if (spectatorJoinedRef.current) {
        updateSpectators(-1);
        spectatorJoinedRef.current = false;
      }
    };
  }, [isSpectator, roomId]);

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
      await base44.entities.GameSession.update(session.id, {
        ...updateData,
        move_count: (session.move_count || 0) + 1
      });

      // Enregistrer le coup en realtime (best-effort)
      try {
        await base44.entities.GameMove?.create?.({
          room_id: roomId,
          player_id: user.id,
          board_state: JSON.stringify(newBoardState),
          next_turn: nextTurn,
          white_time: whiteTime,
          black_time: blackTime
        });
      } catch (moveError) {
        console.log('Realtime move non disponible:', moveError?.message || moveError);
      }
      
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

  const updatePlayerStats = async (playerId, username, result, gameType) => {
    if (!playerId) return;
    const ratingField = gameType === 'chess' ? 'chess_rating' : 'checkers_rating';
    const list = await base44.entities.PlayerStats.filter({ user_id: playerId });
    const existing = list?.[0];
    const stats = existing || {
      user_id: playerId,
      username: username || 'Joueur',
      chess_rating: 1200,
      checkers_rating: 1200,
      games_played: 0,
      games_won: 0,
      games_lost: 0,
      games_drawn: 0
    };

    let delta = 0;
    if (result === 'win') delta = 20;
    if (result === 'loss') delta = -20;
    if (result === 'draw') delta = 5;

    const payload = {
      ...stats,
      games_played: (stats.games_played || 0) + 1,
      games_won: (stats.games_won || 0) + (result === 'win' ? 1 : 0),
      games_lost: (stats.games_lost || 0) + (result === 'loss' ? 1 : 0),
      games_drawn: (stats.games_drawn || 0) + (result === 'draw' ? 1 : 0),
      [ratingField]: Math.max(0, (stats[ratingField] || 1200) + delta),
      username: username || stats.username
    };

    if (existing?.id) {
      await base44.entities.PlayerStats.update(existing.id, payload);
    } else {
      await base44.entities.PlayerStats.create(payload);
    }
  };

  const handleGameEnd = async (status) => {
    if (!session || endGameSentRef.current) return;
    if (session.status === 'finished' || isSpectator) {
      navigate('/Play');
      return;
    }

    endGameSentRef.current = true;

    const gameType = session.game_type || 'checkers';
    const isDraw = status === 'draw';
    const whiteWinner = status === 'whiteWins';
    const blackWinner = status === 'blackWins';
    const winnerId = isDraw ? null : (whiteWinner ? session.player1_id : session.player2_id);
    const loserId = isDraw ? null : (whiteWinner ? session.player2_id : session.player1_id);
    const ranked = !!session.ranked;

    try {
      await base44.entities.GameSession.update(session.id, {
        status: 'finished',
        winner_id: winnerId,
        finished_at: new Date().toISOString()
      });

      await base44.entities.GameResult?.create?.({
        room_id: roomId,
        game_type: gameType,
        winner_id: winnerId,
        loser_id: loserId,
        player1_id: session.player1_id,
        player1_name: session.player1_name,
        player2_id: session.player2_id,
        player2_name: session.player2_name || session.invited_player_name,
        result: isDraw ? 'draw' : (whiteWinner ? 'white' : 'black')
      });

      if (ranked) {
        await Promise.all([
          updatePlayerStats(session.player1_id, session.player1_name, isDraw ? 'draw' : (whiteWinner ? 'win' : 'loss'), gameType),
          updatePlayerStats(session.player2_id, session.player2_name || session.invited_player_name, isDraw ? 'draw' : (blackWinner ? 'win' : 'loss'), gameType)
        ]);
      }

      // Notifications in-app (non-push)
      try {
        const notify = async (userId, title, message) => {
          if (!userId) return;
          await base44.entities.Notification?.create?.({
            user_email: userId,
            type: 'game_result',
            title,
            message,
            link: `GameRoom?roomId=${roomId}`
          });
        };
        if (isDraw) {
          await Promise.all([
            notify(session.player1_id, 'Match nul', 'La partie s’est terminée par un nul'),
            notify(session.player2_id, 'Match nul', 'La partie s’est terminée par un nul')
          ]);
        } else {
          await Promise.all([
            notify(winnerId, 'Victoire', 'Vous avez gagné la partie'),
            notify(loserId, 'Défaite', 'Vous avez perdu la partie')
          ]);
        }
      } catch (e) {
        console.log('Notification résultat échouée:', e?.message || e);
      }
    } catch (e) {
      console.log('Erreur fin de partie:', e?.message || e);
    } finally {
      navigate('/Play');
    }
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
  const canMove = !isSpectator && (
    (playerColor === 'white' && session.current_turn === 'white') || 
    (playerColor === 'black' && session.current_turn === 'black')
  );

  console.log('=== GameRoom DEBUG ===');
  console.log('user.id:', user?.id);
  console.log('session.player1_id:', session?.player1_id);
  console.log('session.player2_id:', session?.player2_id);
  console.log('isPlayerWhite:', isPlayerWhite);
  console.log('playerColor:', playerColor);
  console.log('session.current_turn:', session?.current_turn);
  console.log('canMove:', canMove);

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
        <div className="bg-gradient-to-r from-[#3E2723] to-[#2C1810] border-b-2 border-[#D4A574]/40 px-6 py-4 shadow-xl shadow-black/50 backdrop-blur-lg">
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
                    ? 'text-lime-400' 
                    : 'text-[#D4A574]'
                }`}>
                  {session.player2_id ? (
                    session.current_turn === (isPlayerWhite ? 'black' : 'white') 
                      ? "🟢 C'est son tour" 
                      : 'En attente...'
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
            canMove={canMove && gameStarted && !isSpectator}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
            blockBoard={!gameStarted}
            currentTurnOverride={session?.current_turn}
          />
        ) : (
          <CheckersBoard 
            playerColor={playerColor}
            onGameEnd={handleGameEnd}
            isMultiplayer={true}
            canMove={true}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
            blockBoard={!gameStarted}
            currentTurnOverride={session?.current_turn}
          />
        )}
      </div>

      {/* Chat */}
      <div className="px-6 pb-4">
        <div className="bg-[#2C1810]/70 backdrop-blur-lg border border-[#D4A574]/30 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#F5E6D3]">Chat</h3>
            {loadingMessages && (
              <span className="text-xs text-[#D4A574]">Chargement...</span>
            )}
          </div>
          <ScrollArea className="h-40 w-full rounded-md bg-white/5 p-3">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <p className="text-xs text-[#D4A574]">Aucun message</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="text-xs text-[#F5E6D3]">
                    <span className="font-semibold">{msg.sender_name || 'Joueur'}:</span>{" "}
                    <span className="text-[#D4A574]">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 mt-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Écrire un message..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleSendMessage}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isSpectator || !newMessage.trim()}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </div>

      {/* Barre Joueur Courant - EN BAS */}
      {user && (
        <div className="bg-gradient-to-r from-[#3E2723] to-[#2C1810] border-t-2 border-[#D4A574]/40 px-6 py-4 shadow-xl shadow-black/50 backdrop-blur-lg">
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
                  {canMove ? "🟢 C'est votre tour" : 'En attente de l\'adversaire...'}
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