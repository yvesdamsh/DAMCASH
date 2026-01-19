import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CheckersBoard from '../components/game/CheckersBoard';
import ChessBoard from '../components/game/ChessBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import SpectatorManager from '../components/game/SpectatorManager';

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
    const gameMode = urlParams.get('mode') || 'online';
    const aiLevel = urlParams.get('aiLevel') || 'medium';
    const playerColor = urlParams.get('playerColor') || 'white';
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
  const [drawOffer, setDrawOffer] = useState(null);
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [showResignDialog, setShowResignDialog] = useState(false);
  const [drawOfferSent, setDrawOfferSent] = useState(false);
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(null);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [drawAcceptedModal, setDrawAcceptedModal] = useState(false);
  const [opponentNameForDraw, setOpponentNameForDraw] = useState('');
  const [victoryByResignModal, setVictoryByResignModal] = useState(false);
  const [resignationMessage, setResignationMessage] = useState('');

  // Charger les données initiales
  useEffect(() => {
    if (gameMode === 'ai') {
      // Mode IA: pas besoin de charger depuis la base de données
      setLoading(false);
      setUser(null);
      setGameStarted(true);
    } else if (roomId) {
      loadData();
    } else {
      setLoading(false);
    }

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [roomId, gameMode]);

  // Fallback: recharger périodiquement si le realtime se coupe
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => loadData(), 15000);
    return () => clearInterval(interval);
  }, [roomId]);



  // Realtime: écouter les changements de GameSession pour cette room
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = base44.entities.GameSession.subscribe(async (event) => {
      const matchesRoom = event?.data?.room_id === roomId;
      const matchesSession = event?.id && session?.id && event.id === session.id;
      if (!matchesRoom && !matchesSession) return;
      const sess = event.data;

      setSession(prev => ({ ...prev, ...sess }));

      if (sess.board_state) {
        try {
          setBoardState(JSON.parse(sess.board_state));
        } catch (e) {
          console.log('Erreur parsing board_state');
        }
      }

      if (typeof sess.white_time !== 'undefined') {
        setWhiteTime(sess.white_time);
      }
      if (typeof sess.black_time !== 'undefined') {
        setBlackTime(sess.black_time);
      }

      setGameStarted(!!sess.player2_id || sess.status === 'in_progress');



      // Rafraîchir l'adversaire si nécessaire (sans accès User)
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
  }, [roomId, user?.id, opponent?.id, session?.id]);

  // Realtime dédié aux coups: écouter les créations de GameMove
  useEffect(() => {
  if (!roomId) return;

  const unsubscribe = base44.entities.GameMove?.subscribe?.((event) => {
    if (event?.type !== 'create') return;
    const matchesRoom = event?.data?.room_id === roomId;
    if (!matchesRoom) return;

    const move = event.data;

    if (move.board_state) {
      try {
        setBoardState(JSON.parse(move.board_state));
      } catch (e) {
        console.log('Erreur parsing board_state (move)');
      }
    }

    if (typeof move.white_time !== 'undefined') {
      setWhiteTime(move.white_time);
    }
    if (typeof move.black_time !== 'undefined') {
      setBlackTime(move.black_time);
    }

    if (move.next_turn) {
      setSession(prev => ({ ...prev, current_turn: move.next_turn }));
    }
    if (move.created_date || move.created_at) {
      setSession(prev => ({ ...prev, last_move_timestamp: move.created_date || move.created_at }));
    }
  });

  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  };
  }, [roomId]);





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

    const unsubscribe = base44.entities.GameChatMessage?.subscribe?.((event) => {
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

  // Realtime: écouter les propositions de nul
  useEffect(() => {
    if (!roomId || !user || isSpectator) {
      console.log('DrawOffer listener non activé - roomId:', roomId, 'user:', user?.id, 'isSpectator:', isSpectator);
      return;
    }

    console.log('DrawOffer listener activé pour roomId:', roomId, 'userId:', user.id);

    const unsubscribe = base44.entities.DrawOffer?.subscribe?.((event) => {
      if (!event?.data || event.data.room_id !== roomId) return;
      
      // RECEIVER: J'ai reçu une nouvelle proposition
      if (event?.type === 'create' && event.data.to_player_id === user.id && event.data.status === 'pending') {
        setIncomingDrawOffer(event.data);
      }
      
      // PROPOSER: Ma proposition a été acceptée
      if (event.data.from_player_id === user.id && event.data.status === 'accepted') {
        setDrawOfferSent(false);
        setOpponentNameForDraw(event.data.to_player_id ? opponent?.full_name || 'Votre adversaire' : '');
        setDrawAcceptedModal(true);
      }
      
      // PROPOSER: Ma proposition a été refusée
      if (event.data.from_player_id === user.id && event.data.status === 'declined') {
        setDrawOfferSent(false);
        setIncomingDrawOffer(null);
        toast.info('Proposition refusée', {
          description: `${event.data.to_player_id ? opponent?.full_name || 'Votre adversaire' : 'Votre adversaire'} a refusé votre proposition`
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomId, user?.id, isSpectator]);

  // Realtime: écouter les événements de jeu (abandon)
  useEffect(() => {
    if (!roomId || !user || isSpectator) return;

    const unsubscribe = base44.entities.GameEvent?.subscribe?.((event) => {
      if (!event?.data || event.data.room_id !== roomId) return;

      // ADVERSAIRE ABANDONNE: Je suis le gagnant
      if (event?.type === 'create' && event.data.type === 'resign' && event.data.winner_id === user.id && !victoryByResignModal) {
        console.log('Abandon détecté - gagnant:', user.id, 'abandon de:', event.data.player_name);
        setResignationMessage(event.data.player_name);
        setVictoryByResignModal(true);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomId, user?.id, isSpectator, victoryByResignModal]);



  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !user || !roomId) return;
    if (isSpectator) return;

    try {
      await base44.entities.GameChatMessage?.create?.({
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

  const handleConfirmResign = async () => {
    if (!session || !user || isSpectator) return;

    const winnerId = user.id === session.player1_id ? session.player2_id : session.player1_id;
    const winnerName = user.id === session.player1_id ? (session.player2_name || opponent?.full_name) : session.player1_name;

    try {
      const gameType = session.game_type || 'checkers';

      await base44.entities.GameSession.update(session.id, {
        status: 'finished',
        winner_id: winnerId,
        finished_at: new Date().toISOString()
      });

      const duration = session.last_move_timestamp 
        ? Math.floor((new Date() - new Date(session.created_date)) / 1000)
        : null;

      await base44.entities.GameResult?.create?.({
        room_id: roomId,
        game_type: gameType,
        winner_id: winnerId,
        loser_id: user.id,
        player1_id: session.player1_id,
        player1_name: session.player1_name,
        player2_id: session.player2_id,
        player2_name: session.player2_name || session.invited_player_name,
        result: user.id === session.player1_id ? 'black' : 'white',
        final_board_state: session.board_state,
        moves_count: session.move_count || 0,
        duration_seconds: duration
        });

        // Créer un GameEvent pour notifier l'adversaire en realtime
        await base44.entities.GameEvent?.create?.({
          room_id: roomId,
          type: 'resign',
          player_id: user.id,
          player_name: user.full_name,
          winner_id: winnerId,
          winner_name: winnerName
        });

        await base44.entities.Notification?.create?.({
        user_email: winnerId,
        type: 'game_result',
        title: '🎉 Victoire par abandon',
        message: `${user.full_name} a abandonné la partie`,
        link: `GameRoom?roomId=${roomId}`
        });

        setSession(prev => ({ ...prev, status: 'finished', winner_id: winnerId }));
        setShowResignConfirm(false);

        toast.success('Partie abandonnée', {
        description: `${winnerName} remporte la victoire`,
        duration: 3000
        });

        setTimeout(() => navigate('/Play'), 2000);
        } catch (e) {
        toast.error('Erreur lors de l\'abandon');
        }
        };

  const handleOfferDraw = async () => {
    if (!session || !user || isSpectator) return;

    try {
      const opponentId = user.id === session.player1_id ? session.player2_id : session.player1_id;

      await base44.entities.DrawOffer.create({
        room_id: roomId,
        from_player_id: user.id,
        from_player_name: user.full_name,
        to_player_id: opponentId,
        status: 'pending'
      });

      setDrawOfferSent(true);
      toast.success('Proposition de nul envoyée', {
        description: 'En attente de la réponse...',
        duration: 3000
      });
    } catch (e) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleAcceptDraw = async () => {
    if (!session || !incomingDrawOffer) return;

    try {
      const gameType = session.game_type || 'checkers';
      
      await base44.entities.GameSession.update(session.id, {
        status: 'finished',
        winner_id: null,
        finished_at: new Date().toISOString()
      });

      const duration = session.last_move_timestamp 
        ? Math.floor((new Date() - new Date(session.created_date)) / 1000)
        : null;

      await base44.entities.GameResult?.create?.({
        room_id: roomId,
        game_type: gameType,
        winner_id: null,
        loser_id: null,
        player1_id: session.player1_id,
        player1_name: session.player1_name,
        player2_id: session.player2_id,
        player2_name: session.player2_name || session.invited_player_name,
        result: 'draw',
        final_board_state: session.board_state,
        moves_count: session.move_count || 0,
        duration_seconds: duration
      });

      await base44.entities.DrawOffer.update(incomingDrawOffer.id, { status: 'accepted' });
      
      await Promise.all([
        base44.entities.Notification?.create?.({
          user_email: session.player1_id,
          type: 'game_result',
          title: '🤝 Match nul accepté',
          message: 'La partie se termine par un match nul',
          link: `GameRoom?roomId=${roomId}`
        }),
        base44.entities.Notification?.create?.({
          user_email: session.player2_id,
          type: 'game_result',
          title: '🤝 Match nul accepté',
          message: 'La partie se termine par un match nul',
          link: `GameRoom?roomId=${roomId}`
        })
      ]);
      
      setSession(prev => ({ ...prev, status: 'finished', winner_id: null }));
      setIncomingDrawOffer(null);
      
      toast.success('Match nul', {
        description: 'La partie se termine par un accord mutuel',
        duration: 5000,
        icon: '🤝'
      });
      
      setTimeout(() => navigate('/Play'), 2000);
    } catch (e) {
      console.log('Erreur accepter nul:', e?.message || e);
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const handleDeclineDraw = async () => {
    if (!incomingDrawOffer) return;

    try {
      await base44.entities.DrawOffer.update(incomingDrawOffer.id, { status: 'declined' });

      await base44.entities.Notification?.create?.({
        user_email: incomingDrawOffer.from_player_id,
        type: 'game_result',
        title: '❌ Proposition refusée',
        message: 'Votre proposition de match nul a été refusée'
      });

      setIncomingDrawOffer(null);
      setDrawOfferSent(false);

      toast.info('Proposition refusée', {
        description: 'La partie continue'
      });
    } catch (e) {
      toast.error('Erreur lors du refus');
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

      // Vérifier si l'utilisateur est banni en tant que spectateur
      if (isSpectator) {
        const banned = await base44.entities.BannedSpectator.filter({
          room_id: roomId,
          banned_user_id: currentUser.id
        });
        if (banned.length > 0) {
          toast.error('Accès refusé', {
            description: 'Vous avez été banni de cette partie',
            duration: 5000
          });
          setTimeout(() => navigate('/Play'), 2000);
          return;
        }

        // Vérifier si la demande est acceptée
        const requests = await base44.entities.SpectatorRequest.filter({
          room_id: roomId,
          requester_id: currentUser.id,
          status: 'accepted'
        });
        if (requests.length === 0) {
          toast.error('Accès non autorisé', {
            description: 'Vous devez être accepté pour observer cette partie',
            duration: 5000
          });
          setTimeout(() => navigate('/Play'), 2000);
          return;
        }
      }

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
            status: 'in_progress'
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
    if (!session || endGameSentRef.current) return;
    endGameSentRef.current = true;
    
    try {
      const winnerId = playerColor === 'white' ? session.player2_id : session.player1_id;
      const loserId = playerColor === 'white' ? session.player1_id : session.player2_id;
      const winnerName = playerColor === 'white' ? (session.player2_name || opponent?.full_name) : session.player1_name;
      const loserName = playerColor === 'white' ? session.player1_name : (session.player2_name || opponent?.full_name);
      
      await base44.entities.GameSession.update(session.id, {
        status: 'finished',
        winner_id: winnerId,
        finished_at: new Date().toISOString()
      });
      
      await Promise.all([
        base44.entities.Notification?.create?.({
          user_email: winnerId,
          type: 'game_result',
          title: '⏱️ Victoire au temps',
          message: `${loserName} a dépassé le temps imparti`,
          link: `GameRoom?roomId=${roomId}`
        }),
        base44.entities.Notification?.create?.({
          user_email: loserId,
          type: 'game_result',
          title: '⏱️ Défaite au temps',
          message: 'Votre temps est écoulé',
          link: `GameRoom?roomId=${roomId}`
        })
      ]);
      
      setSession(prev => ({ ...prev, status: 'finished', winner_id: winnerId }));
      
      if (user?.id === loserId) {
        toast.error('Temps écoulé !', {
          description: 'Vous avez perdu au temps',
          duration: 5000,
          icon: '⏱️'
        });
      } else {
        toast.success('Victoire !', {
          description: `${loserName} a dépassé le temps`,
          duration: 5000,
          icon: '⏱️'
        });
      }
      
      setTimeout(() => navigate('/Play'), 3000);
    } catch (error) {
      console.error('Erreur time out:', error);
      endGameSentRef.current = false;
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

      const duration = session.last_move_timestamp 
        ? Math.floor((new Date() - new Date(session.created_date)) / 1000)
        : null;

      await base44.entities.GameResult?.create?.({
        room_id: roomId,
        game_type: gameType,
        winner_id: winnerId,
        loser_id: loserId,
        player1_id: session.player1_id,
        player1_name: session.player1_name,
        player2_id: session.player2_id,
        player2_name: session.player2_name || session.invited_player_name,
        result: isDraw ? 'draw' : (whiteWinner ? 'white' : 'black'),
        final_board_state: session.board_state,
        moves_count: session.move_count || 0,
        duration_seconds: duration
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!session && gameMode !== 'ai') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <p className="text-xl">Jeu introuvable</p>
        <Button onClick={() => navigate('/Play')} className="bg-amber-600 hover:bg-amber-700">
          Retour
        </Button>
      </div>
    );
  }

  const computedPlayerColor = user && session && user.id === session.player1_id ? 'white' : 'black';
  
  // Forcer le mode multijoueur si on a une vraie session avec deux joueurs
  const isActuallyMultiplayer = session && session.player1_id && (session.player2_id || session.invited_player_id);
  const actualGameMode = isActuallyMultiplayer ? 'online' : gameMode;
  
  const effectivePlayerColor = actualGameMode === 'ai' ? playerColor : computedPlayerColor;
  const isPlayerWhite = actualGameMode === 'ai' ? playerColor === 'white' : user?.id === session?.player1_id;
  const gameType = session?.game_type;
  const canMove = actualGameMode !== 'ai' && !isSpectator && (
    (effectivePlayerColor === 'white' && session?.current_turn === 'white') || 
    (effectivePlayerColor === 'black' && session?.current_turn === 'black')
  );

  // Mode IA: afficher directement le plateau (SANS boutons car ils sont en bas)
  if (actualGameMode === 'ai') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#D4A574]/30 bg-gradient-to-b from-[#5D3A1A] to-[#2C1810]">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/Checkers')}
              className="text-[#F5E6D3] hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold">⚫ Dames vs IA</h1>
            <div className="w-20" />
          </div>
        </div>

        {/* Plateau de jeu */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-6">
          <CheckersBoard 
              playerColor={effectivePlayerColor}
              aiLevel={aiLevel}
              onGameEnd={() => {}}
            />
        </div>
      </div>
    );
  }

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
    <>
      {/* Modal: Proposition de nul reçue */}
      <Dialog open={!!incomingDrawOffer} onOpenChange={(open) => { if (!open) handleDeclineDraw(); }}>
        <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">🤝 Proposition de match nul</DialogTitle>
            <DialogDescription className="text-[#D4A574] mt-3">
              {incomingDrawOffer?.from_player_name} propose un match nul. Acceptez-vous?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex">
            <Button
              onClick={handleDeclineDraw}
              variant="outline"
              className="flex-1"
            >
              ❌ Refuser
            </Button>
            <Button
              onClick={handleAcceptDraw}
              className="flex-1 bg-green-700 hover:bg-green-800"
            >
              ✅ Accepter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmation abandon */}
      <Dialog open={showResignConfirm} onOpenChange={setShowResignConfirm}>
        <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-400">⚠️ Abandonner la partie?</DialogTitle>
            <DialogDescription className="text-[#D4A574] mt-3">
              Votre adversaire remportera la victoire. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex">
            <Button
              onClick={() => setShowResignConfirm(false)}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmResign}
              className="flex-1 bg-red-700 hover:bg-red-800"
            >
              🏳️ Confirmer abandon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nul accepté par l'adversaire */}
      <Dialog open={drawAcceptedModal} onOpenChange={(open) => { if (!open) { setDrawAcceptedModal(false); setTimeout(() => navigate('/Home'), 500); } }}>
        <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-400">🤝 Match nul accepté!</DialogTitle>
            <DialogDescription className="text-[#D4A574] mt-3">
              {opponentNameForDraw} a accepté votre proposition de match nul.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex">
            <Button
              onClick={() => { setDrawAcceptedModal(false); setTimeout(() => navigate('/Home'), 500); }}
              className="flex-1 bg-green-700 hover:bg-green-800"
            >
              ✅ Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Victoire par abandon */}
      <Dialog open={victoryByResignModal} onOpenChange={(open) => { if (!open) { setVictoryByResignModal(false); setTimeout(() => navigate('/Home'), 500); } }}>
        <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-400">🎉 Victoire!</DialogTitle>
            <DialogDescription className="text-[#D4A574] mt-3">
              {resignationMessage} a abandonné la partie. Vous gagnez!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6 flex">
            <Button
              onClick={() => { setVictoryByResignModal(false); setTimeout(() => navigate('/Home'), 500); }}
              className="flex-1 bg-green-700 hover:bg-green-800"
            >
              ✅ Retour à l'accueil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <motion.div 
              animate={{
                scale: (isPlayerWhite ? blackTime : whiteTime) < 60 && session.current_turn === (isPlayerWhite ? 'black' : 'white') ? [1, 1.05, 1] : 1
              }}
              transition={{ repeat: (isPlayerWhite ? blackTime : whiteTime) < 60 && session.current_turn === (isPlayerWhite ? 'black' : 'white') ? Infinity : 0, duration: 1 }}
              className={`text-4xl font-bold font-mono px-6 py-2 rounded-lg transition-all ${
                (isPlayerWhite ? blackTime : whiteTime) < 60 && (isPlayerWhite ? blackTime : whiteTime) > 0
                  ? 'bg-red-500/30 border-2 border-red-500 text-red-400 shadow-lg shadow-red-500/50 animate-pulse'
                  : session.current_turn === (isPlayerWhite ? 'black' : 'white') 
                    ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-400' 
                    : 'bg-[#2C1810] border-2 border-[#D4A574]/50 text-[#F5E6D3]'
              }`}
            >
              {(isPlayerWhite ? blackTime : whiteTime) < 60 && (isPlayerWhite ? blackTime : whiteTime) > 0 && (
                <AlertTriangle className="inline w-6 h-6 mr-2 animate-bounce" />
              )}
              {formatTime(isPlayerWhite ? blackTime : whiteTime)}
            </motion.div>
          </div>
        </div>
      )}



      {/* Plateau de jeu */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="text-center">
              <p className="text-lg text-[#D4A574]">En attente de l'adversaire...</p>
            </div>
          </div>
        )}
        {gameType === 'chess' ? (
          <ChessBoard 
            playerColor={effectivePlayerColor}
            onGameEnd={handleGameEnd}
            isMultiplayer={true}
            canMove={canMove && gameStarted && !isSpectator}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
            blockBoard={!gameStarted}
            currentTurnOverride={session?.current_turn}
            gameStats={{
              gameType,
              moveCount: session?.move_count || 0,
              timeControl: session?.time_control || 'classic'
            }}
          />
        ) : (
          <CheckersBoard 
            playerColor={effectivePlayerColor}
            onGameEnd={handleGameEnd}
            isMultiplayer={true}
            canMove={canMove && gameStarted && !isSpectator}
            initialBoardState={boardState}
            onSaveMove={handleSaveMove}
            blockBoard={!gameStarted}
            currentTurnOverride={session?.current_turn}
            gameStats={{
              gameType,
              moveCount: session?.move_count || 0,
              timeControl: session?.time_control || 'classic'
            }}
          />
        )}
      </div>

      {/* Actions de jeu et Chat */}
      <div className="px-6 pb-4 space-y-4">

        {/* Boutons d'action */}
        {!isSpectator && (
          <div className="flex gap-3 justify-center my-4">
            <Button 
              onClick={handleOfferDraw}
              disabled={drawOfferSent || session?.status !== 'in_progress'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🤝 {drawOfferSent ? 'En attente...' : 'Proposer nul'}
            </Button>
            <Button 
              onClick={() => setShowResignConfirm(true)}
              disabled={session?.status !== 'in_progress'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              🏳️ Abandonner
            </Button>
            {user && session && user.id === session.player1_id && (
              <SpectatorManager roomId={roomId} hostId={user.id} session={session} />
            )}
          </div>
        )}

        {/* Chat */}
        <div className="bg-[#2C1810] border border-[#D4A574]/30 rounded-xl p-4">
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
            <motion.div
              animate={{
                scale: (isPlayerWhite ? whiteTime : blackTime) < 60 && canMove ? [1, 1.05, 1] : 1
              }}
              transition={{ repeat: (isPlayerWhite ? whiteTime : blackTime) < 60 && canMove ? Infinity : 0, duration: 1 }}
              className={`text-4xl font-bold font-mono px-6 py-2 rounded-lg transition-all ${
                (isPlayerWhite ? whiteTime : blackTime) < 60 && (isPlayerWhite ? whiteTime : blackTime) > 0
                  ? 'bg-red-500/30 border-2 border-red-500 text-red-400 shadow-lg shadow-red-500/50 animate-pulse'
                  : canMove 
                    ? 'bg-green-500/20 border-2 border-green-500 text-green-400' 
                    : 'bg-[#2C1810] border-2 border-[#D4A574]/50 text-[#F5E6D3]'
              }`}
            >
              {(isPlayerWhite ? whiteTime : blackTime) < 60 && (isPlayerWhite ? whiteTime : blackTime) > 0 && (
                <AlertTriangle className="inline w-6 h-6 mr-2 animate-bounce" />
              )}
              {formatTime(isPlayerWhite ? whiteTime : blackTime)}
            </motion.div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}