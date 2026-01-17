import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoomChat from '../components/room/RoomChat';

export default function RoomDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');

  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameStarting, setGameStarting] = useState(false);

  useEffect(() => {
    if (roomId) {
      loadData();
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = base44.entities.Room.subscribe((event) => {
      if (event.id === roomId) {
        setRoom(event.data);
      }
    });
    return () => unsubscribe?.();
  }, [roomId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const rooms = await base44.entities.Room.filter({ id: roomId }, '-created_date', 1);
      if (rooms.length > 0) {
        setRoom(rooms[0]);
        // Charger les infos des joueurs
        loadPlayers(rooms[0].players || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async (playerIds) => {
    try {
      const onlineUsers = await base44.entities.OnlineUser.filter(
        {}
      );
      const playerData = onlineUsers.filter(ou => playerIds.includes(ou.user_id));
      setPlayers(playerData);
    } catch (error) {
      console.error('Erreur chargement joueurs:', error);
    }
  };

  const startGame = async () => {
    if (!room || !user || room.current_players < 2) return;

    setGameStarting(true);
    try {
      // Créer une GameSession
      const gameSession = await base44.entities.GameSession.create({
        room_id: roomId,
        player1_id: room.owner_id,
        player1_email: user.email,
        player1_name: user.full_name,
        game_type: room.game_type,
        time_control: room.time_control,
        status: 'in_progress',
        current_turn: 'white'
      });

      // Mettre à jour le salon
      await base44.entities.Room.update(room.id, {
        status: 'in_progress'
      });

      navigate(`/GameRoom?roomId=${roomId}`);
    } catch (error) {
      console.error('Erreur démarrage partie:', error);
      alert('Erreur en démarrant la partie');
    } finally {
      setGameStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <p className="text-xl">Salon introuvable</p>
        <Button onClick={() => navigate('/RoomLobby')} className="bg-amber-600 hover:bg-amber-700">
          Retour
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === room.owner_id;
  const isFull = room.current_players >= room.max_players;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/RoomLobby')}
            variant="ghost"
            className="text-[#F5E6D3] hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">{room.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Infos du salon */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#5D3A1A]/50 border border-[#D4A574]/30 rounded-lg p-6"
            >
              <h2 className="text-xl font-bold mb-4">Informations</h2>
              <div className="space-y-2 text-[#D4A574]">
                <p><span className="text-[#F5E6D3]">Propriétaire:</span> {room.owner_name}</p>
                <p><span className="text-[#F5E6D3]">Type:</span> {room.game_type === 'checkers' ? '⚫ Dames' : '♔ Échecs'}</p>
                <p><span className="text-[#F5E6D3]">Temps:</span> {room.time_control}</p>
                <p><span className="text-[#F5E6D3]">Joueurs:</span> {room.current_players}/{room.max_players}</p>
                <p><span className="text-[#F5E6D3]">Statut:</span> {room.is_private ? '🔒 Privé' : '🔓 Public'}</p>
                {room.description && (
                  <p><span className="text-[#F5E6D3]">Description:</span> {room.description}</p>
                )}
              </div>

              {/* Joueurs */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3">Joueurs en ligne</h3>
                <div className="space-y-2">
                  <AnimatePresence>
                    {players.map((player) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-[#2C1810] rounded-lg p-3 flex items-center justify-between border border-[#D4A574]/20"
                      >
                        <span className="text-[#F5E6D3]">{player.username}</span>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bouton démarrage */}
              {isOwner && !isFull && room.current_players >= 2 && (
                <Button
                  onClick={startGame}
                  disabled={gameStarting}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {gameStarting ? 'Démarrage...' : 'Démarrer la partie'}
                </Button>
              )}
            </motion.div>
          </div>

          {/* Chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-96 lg:h-auto"
          >
            <RoomChat roomId={roomId} user={user} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}