import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search as SearchIcon, UserPlus, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import InviteModal from '../components/game/InviteModal';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedGame, setSelectedGame] = useState('chess');
  const [sentInvitations, setSentInvitations] = useState(new Set());
  const [sentFriendRequests, setSentFriendRequests] = useState(new Set());
  const [loading, setLoading] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadAllPlayers();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        setUser(await base44.auth.me());
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const loadAllPlayers = async () => {
    try {
      const allPlayers = await base44.entities.OnlineUser.list();
      // Exclure l'utilisateur actuellement connecté (par user_id)
      const currentUserId = user?.id;
      const filtered = allPlayers.filter(player => {
        return player.user_id && currentUserId && player.user_id !== currentUserId;
      });
      setResults(filtered);
    } catch (error) {
      console.error('Erreur chargement joueurs:', error);
      setResults([]);
    }
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setQuery(searchValue);
    
    if (!searchValue.trim()) {
      loadAllPlayers();
      return;
    }

    const filtered = results.filter(u =>
      u.username.toLowerCase().includes(searchValue.toLowerCase())
    );
    setResults(filtered);
  };

  const generateUUID = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddFriend = async (opponent) => {
    if (!user) {
      console.log('Utilisateur non authentifié');
      base44.auth.redirectToLogin();
      return;
    }

    const playerId = opponent.user_id;
    setLoading(prev => new Set(prev).add(playerId));
    
    try {
      console.log('Envoi demande ami:', { sender_id: user.id, receiver_id: opponent.user_id });
      
      await base44.entities.FriendRequest.create({
        sender_id: user.id,
        receiver_id: opponent.user_id,
        status: 'pending'
      });
      
      setSentFriendRequests(prev => new Set(prev).add(playerId));
      console.log('Demande ami créée avec succès');
      alert(`Demande d'ami envoyée à ${opponent.username} !`);
      
      setTimeout(() => {
        setSentFriendRequests(prev => {
          const updated = new Set(prev);
          updated.delete(playerId);
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error('Erreur ajout ami:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(prev => {
        const updated = new Set(prev);
        updated.delete(playerId);
        return updated;
      });
    }
  };

  const handleOpenInviteModal = (opponent) => {
    if (!user) {
      console.log('Utilisateur non authentifié');
      base44.auth.redirectToLogin();
      return;
    }
    setSelectedOpponent(opponent);
    setIsModalOpen(true);
  };

  const handleSendInvite = async (config) => {
    if (!user || !selectedOpponent) return;

    const playerId = selectedOpponent.user_id;
    setLoading(prev => new Set(prev).add(playerId));
    
    try {
      const roomId = generateUUID();
      console.log('Création invitation avec config:', { 
        sender_id: user.id, 
        receiver_id: selectedOpponent.user_id, 
        game_type: config.game_type,
        room_id: roomId,
        time_control: config.time_control
      });
      
      // Créer GameSession avec timers
      const timeControl = config.time_control || 'classic';
      const timeInSeconds = timeControl === 'bullet' ? 60 : 
                           timeControl === 'blitz' ? 180 : 
                           timeControl === 'rapid' ? 600 : 
                           timeControl === 'classic' ? 1800 : null;

      await base44.entities.GameSession.create({
        room_id: roomId,
        player1_id: user.id,
        player1_email: user.email,
        player1_name: user.full_name,
        invited_player_id: selectedOpponent.user_id,
        invited_player_name: selectedOpponent.username,
        game_type: config.game_type,
        status: 'waiting',
        current_turn: 'white',
        time_control: timeControl,
        white_time: timeInSeconds,
        black_time: timeInSeconds,
        moves: JSON.stringify([])
      });

      await base44.entities.GameInvitation.create({
        sender_id: user.id,
        sender_name: user.full_name,
        receiver_id: selectedOpponent.user_id,
        game_type: config.game_type,
        status: 'pending',
        room_id: roomId
      });

      console.log('Création notification pour:', selectedOpponent.user_id);
      if (selectedOpponent.email) {
        await base44.entities.Notification.create({
          user_email: selectedOpponent.email,
          type: 'match_invitation',
          title: `Invitation à jouer aux ${config.game_type === 'chess' ? 'Échecs' : 'Dames'}`,
          message: `${user.full_name} vous invite à jouer aux ${config.game_type === 'chess' ? 'Échecs' : 'Dames'}`,
          link: `GameRoom?roomId=${roomId}`,
          from_user: user.email
        });
      }

      setSentInvitations(prev => new Set(prev).add(playerId));
      console.log('GameSession et invitation créées avec succès');
      
      // Rediriger l'expéditeur vers la game room en attente
      navigate(`/GameRoom?roomId=${roomId}`);
      
      setTimeout(() => {
        setSentInvitations(prev => {
          const updated = new Set(prev);
          updated.delete(playerId);
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error('Erreur invitation complète:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(prev => {
        const updated = new Set(prev);
        updated.delete(playerId);
        return updated;
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Rechercher des joueurs</h1>

      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setSelectedGame('chess')}
          className={`flex-1 ${selectedGame === 'chess' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white/10 hover:bg-white/20'}`}
        >
          ♔ Échecs
        </Button>
        <Button
          onClick={() => setSelectedGame('checkers')}
          className={`flex-1 ${selectedGame === 'checkers' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white/10 hover:bg-white/20'}`}
        >
          ⚫ Dames
        </Button>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={query}
          onChange={handleSearch}
          placeholder="Nom du joueur..."
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-10 h-10 bg-amber-900 text-amber-200">
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{player.username}</h3>
                  <Badge className="bg-green-500 text-white">En ligne</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenInviteModal(player)}
                  disabled={loading.has(player.user_id) || sentInvitations.has(player.user_id)}
                  className={`${
                    sentInvitations.has(player.user_id)
                      ? 'border-green-500/50 text-green-400 bg-green-500/10 hover:bg-green-500/10'
                      : 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  {sentInvitations.has(player.user_id) ? 'Invitation envoyée ✓' : 'Inviter à jouer'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddFriend(player)}
                  disabled={loading.has(player.user_id) || sentFriendRequests.has(player.user_id)}
                  className={`${
                    sentFriendRequests.has(player.user_id)
                      ? 'border-green-500/50 text-green-400 bg-green-500/10 hover:bg-green-500/10'
                      : 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  {sentFriendRequests.has(player.user_id) ? '✓' : <UserPlus className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun joueur trouvé</p>
        </div>
      )}

      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        opponent={selectedOpponent}
        onSendInvite={handleSendInvite}
      />
    </div>
  );
}