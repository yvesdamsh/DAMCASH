import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Lock, Users, Clock, ArrowLeft, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateRoomModal from '../components/room/CreateRoomModal';
import { toast } from 'sonner';

const TIME_CONTROL_LABELS = {
  bullet: 'Bullet (1 min)',
  blitz: 'Blitz (3 min)',
  rapid: 'Rapide (10 min)',
  classic: 'Classique (30 min)',
  unlimited: 'Illimité'
};

export default function RoomLobby() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningRoom, setJoiningRoom] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.Room.subscribe((event) => {
      loadRooms();
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [rooms, filter, searchQuery]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      await loadRooms();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const allRooms = await base44.entities.Room.list('-created_date');
      setRooms(allRooms);
    } catch (error) {
      console.error('Erreur chargement salons:', error);
    }
  };

  const filterRooms = () => {
    let result = rooms;

    if (filter === 'public') {
      result = result.filter((r) => !r.is_private);
    } else if (filter === 'my') {
      result = result.filter((r) => r.owner_id === user?.id);
    }

    if (searchQuery) {
      result = result.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRooms(result);
  };

  const joinRoom = async (room) => {
    if (!user) return;
    if (room.is_private) {
      const password = prompt('Entrez le mot de passe du salon:');
      if (password !== room.password) {
        alert('Mot de passe incorrect');
        return;
      }
    }

    setJoiningRoom(room.id);
    try {
      const updatedPlayers = [...(room.players || []), user.id];
      await base44.entities.Room.update(room.id, {
        players: updatedPlayers,
        current_players: (room.current_players || 1) + 1
      });
      navigate(`/GameRoom?roomId=${room.id}`);
    } catch (error) {
      console.error('Erreur rejoindre salon:', error);
      alert('Erreur en rejoignant le salon');
    } finally {
      setJoiningRoom(null);
    }
  };

  const handleSpectateRequest = async (room) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const banned = await base44.entities.BannedSpectator.filter({
        room_id: room.id,
        banned_user_id: user.id
      });
      if (banned.length > 0) {
        toast.error('Accès refusé', {
          description: 'Vous avez été banni de cette partie'
        });
        return;
      }

      const existing = await base44.entities.SpectatorRequest.filter({
        room_id: room.id,
        requester_id: user.id,
        status: 'pending'
      });
      if (existing.length > 0) {
        toast.info('Demande en attente', {
          description: 'Votre demande est en cours de traitement'
        });
        return;
      }

      const accepted = await base44.entities.SpectatorRequest.filter({
        room_id: room.id,
        requester_id: user.id,
        status: 'accepted'
      });
      if (accepted.length > 0) {
        navigate(`/GameRoom?roomId=${room.id}&spectate=true`);
        return;
      }

      await base44.entities.SpectatorRequest.create({
        room_id: room.id,
        requester_id: user.id,
        requester_name: user.full_name,
        host_id: room.owner_id,
        status: 'pending'
      });

      await base44.entities.Notification?.create?.({
        user_email: room.owner_id,
        type: 'spectator_request',
        title: '👁️ Demande de spectateur',
        message: `${user.full_name} souhaite observer votre partie`,
        link: `GameRoom?roomId=${room.id}`,
        from_user: user.email,
        icon: '👁️'
      });

      toast.success('Demande envoyée', {
        description: 'L\'hôte va examiner votre demande',
        icon: '👁️'
      });
    } catch (e) {
      console.log('Erreur demande spectateur:', e);
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleRoomCreated = (room) => {
    navigate(`/RoomDetail?roomId=${room.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/Play')}
              variant="ghost"
              className="text-[#F5E6D3] hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold">Salons multijoueur</h1>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un salon
          </Button>
        </div>

        {/* Filtres */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'public', 'my'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === f
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#5D3A1A] text-[#D4A574] hover:bg-[#6D4A2A]'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'public' ? 'Publics' : 'Mes salons'}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un salon..."
            className="w-full bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-4 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]"
          />
        </div>

        {/* Salons */}
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <motion.div
                   key={room.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="bg-[#5D3A1A]/50 backdrop-blur-lg border border-[#D4A574]/30 rounded-lg p-4 hover:bg-[#5D3A1A]/70 hover:border-[#D4A574]/50 transition-all shadow-lg hover:shadow-xl"
                 >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#F5E6D3]">
                          {room.name}
                        </h3>
                        {room.is_private && (
                          <Lock className="w-4 h-4 text-[#D4A574]" />
                        )}
                      </div>
                      <p className="text-sm text-[#D4A574]/70 mb-3">
                        {room.description}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 text-[#D4A574]">
                          <Users className="w-4 h-4" />
                          {room.current_players}/{room.max_players} joueurs
                        </span>
                        <span className="flex items-center gap-1 text-[#D4A574]">
                          <Clock className="w-4 h-4" />
                          {TIME_CONTROL_LABELS[room.time_control]}
                        </span>
                        <span className="text-[#D4A574]">
                          {room.game_type === 'checkers' ? '⚫ Dames' : '♔ Échecs'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => joinRoom(room)}
                        disabled={
                          room.current_players >= room.max_players ||
                          joiningRoom === room.id ||
                          room.status !== 'waiting'
                        }
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                      >
                        {joiningRoom === room.id
                          ? 'Connexion...'
                          : room.current_players >= room.max_players
                          ? 'Complet'
                          : 'Rejoindre'}
                      </Button>
                      {room.status === 'in_progress' && (
                        <Button
                          onClick={() => handleSpectateRequest(room)}
                          variant="outline"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Observer
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-[#D4A574]/70 text-lg mb-4">
                  Aucun salon disponible
                </p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un salon
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
}