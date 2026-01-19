import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/ui/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export default function OnlinePlayers() {
  const navigate = useNavigate();
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [invitingPlayerId, setInvitingPlayerId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [onlinePlayers, searchQuery]);

  useEffect(() => {
    const unsubscribe = base44.entities.OnlineUser?.subscribe?.((event) => {
      loadOnlinePlayers();
    });
    return () => unsubscribe?.();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      await loadOnlinePlayers();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnlinePlayers = async () => {
    try {
      const players = await base44.entities.OnlineUser.filter({ status: 'online' });
      setOnlinePlayers(players || []);
    } catch (error) {
      console.error('Erreur chargement joueurs:', error);
    }
  };

  const filterPlayers = () => {
    let result = onlinePlayers.filter(p => p.user_id !== user?.id);

    if (searchQuery) {
      result = result.filter(p =>
        p.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlayers(result);
  };

  const handleInvite = async (targetPlayer) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setInvitingPlayerId(targetPlayer.user_id);

    try {
      // Create game invitation
      await base44.entities.GameInvitation.create({
        sender_id: user.id,
        receiver_id: targetPlayer.user_id,
        game_type: 'chess',
        status: 'pending',
        room_id: 'temp-' + Date.now()
      });

      // Create notification for the other player
      await base44.entities.Notification?.create?.({
        user_email: targetPlayer.user_id,
        type: 'game_invitation',
        title: '🎮 Invitation à jouer',
        message: `${user.full_name} vous invite à jouer aux échecs`,
        from_user: user.email,
        link: `Invitations`
      });

      toast.success('Invitation envoyée', {
        description: `${targetPlayer.username} a reçu votre invitation`,
        icon: '✅'
      });
    } catch (e) {
      console.log('Erreur invitation:', e);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInvitingPlayerId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un joueur..."
          className="w-full bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-4 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]"
        />
      </div>

      {/* Players list */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#5D3A1A]/50 backdrop-blur-lg border border-[#D4A574]/30 rounded-lg p-4 hover:bg-[#5D3A1A]/70 hover:border-[#D4A574]/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  {/* Player info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Online indicator */}
                    <div className="relative">
                      <UserAvatar 
                        user={{ full_name: player.username, avatar_url: player.avatar_url }}
                        size="sm"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2C1810]" />
                    </div>

                    {/* Player details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#F5E6D3] truncate">{player.username}</p>
                      <p className="text-sm text-[#D4A574]/70">
                        En ligne depuis {player.last_seen ? new Date(player.last_seen).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'récemment'}
                      </p>
                    </div>
                  </div>

                  {/* Invite button */}
                  <Button
                    onClick={() => handleInvite(player)}
                    disabled={invitingPlayerId === player.user_id}
                    className="bg-amber-600 hover:bg-amber-700 ml-4 whitespace-nowrap"
                  >
                    {invitingPlayerId === player.user_id ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        En cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Inviter
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-[#D4A574]/70 text-lg">
                {onlinePlayers.length === 0 
                  ? 'Aucun joueur en ligne'
                  : 'Aucun joueur ne correspond à votre recherche'
                }
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}