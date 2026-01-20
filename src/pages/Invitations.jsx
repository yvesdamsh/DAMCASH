import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/ui/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X, Crown, Circle, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Invitations() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('parties');
  const [gameInvitations, setGameInvitations] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [senderData, setSenderData] = useState({});

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  useEffect(() => {
    if (!user) return;

    loadInvitations();

    const unsubscribeInvites = base44.entities.GameInvitation.subscribe((event) => {
      if (event?.data?.receiver_id === user.id) {
        loadInvitations();
      }
    });

    const unsubscribeFriends = base44.entities.FriendRequest.subscribe((event) => {
      if (event?.data?.receiver_id === user.id) {
        loadInvitations();
      }
    });

    // Fallback si le realtime est interrompu
    const interval = setInterval(loadInvitations, 15000);

    return () => {
      clearInterval(interval);
      if (typeof unsubscribeInvites === 'function') unsubscribeInvites();
      if (typeof unsubscribeFriends === 'function') unsubscribeFriends();
    };
  }, [user?.id]);

  const loadInvitations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Chargement invitations pour:', user.id);
      
      // Charger les invitations de jeu
      const gameInvs = await base44.entities.GameInvitation.filter({
        receiver_id: user.id,
        status: 'pending'
      });
      console.log('Invitations de jeu trouvées:', gameInvs);
      setGameInvitations(gameInvs);

      // Charger les demandes d'ami
      const friendReqs = await base44.entities.FriendRequest.filter({
        receiver_id: user.id,
        status: 'pending'
      });
      console.log('Demandes d\'ami trouvées:', friendReqs);
      setFriendRequests(friendReqs);

      // Charger les données des expéditeurs depuis OnlineUser
      const senders = {};
      const allInvitations = [...gameInvs, ...friendReqs];
      
      for (const inv of allInvitations) {
        if (!senders[inv.sender_id]) {
          try {
            const onlineUsers = await base44.entities.OnlineUser.filter({ user_id: inv.sender_id });
            if (onlineUsers.length > 0) {
              senders[inv.sender_id] = {
                full_name: onlineUsers[0].username,
                avatar_url: onlineUsers[0].avatar_url
              };
            } else {
              // Fallback si pas dans OnlineUser
              senders[inv.sender_id] = {
                full_name: inv.sender_name || 'Joueur',
                avatar_url: null
              };
            }
          } catch (e) {
            senders[inv.sender_id] = {
              full_name: inv.sender_name || 'Joueur',
              avatar_url: null
            };
          }
        }
      }
      setSenderData(senders);
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptGame = async (invitation) => {
    try {
      console.log('Acceptation invitation:', invitation.id);
      
      // Mettre à jour GameSession avec player2 et démarrer
      await base44.entities.GameSession.filter({ room_id: invitation.room_id }).then(sessions => {
        if (sessions.length > 0) {
          const session = sessions[0];
          return base44.entities.GameSession.update(session.id, {
            player2_id: user.id,
            player2_email: user.email,
            player2_name: user.full_name,
            status: 'in_progress'
          });
        }
      });

      await base44.entities.GameInvitation.update(invitation.id, { status: 'accepted' });
      console.log('Redirection vers room:', invitation.room_id);
      navigate(`/GameRoom?roomId=${invitation.room_id}`);
    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      alert('Erreur lors de l\'acceptation de l\'invitation');
    }
  };

  const handleDeclineGame = async (invitationId) => {
    try {
      console.log('Refus invitation:', invitationId);
      await base44.entities.GameInvitation.update(invitationId, { status: 'declined' });
      loadInvitations();
    } catch (error) {
      console.error('Erreur refus invitation:', error);
      alert('Erreur lors du refus de l\'invitation');
    }
  };

  const handleAcceptFriend = async (requestId) => {
    try {
      console.log('Acceptation demande ami:', requestId);
      await base44.entities.FriendRequest.update(requestId, { status: 'accepted' });
      loadInvitations();
    } catch (error) {
      console.error('Erreur acceptation demande ami:', error);
      alert('Erreur lors de l\'acceptation');
    }
  };

  const handleDeclineFriend = async (requestId) => {
    try {
      console.log('Refus demande ami:', requestId);
      await base44.entities.FriendRequest.update(requestId, { status: 'declined' });
      loadInvitations();
    } catch (error) {
      console.error('Erreur refus demande ami:', error);
      alert('Erreur lors du refus');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Connectez-vous</h2>
          <p className="text-gray-400 mb-4">Pour voir vos invitations</p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-amber-500 to-amber-600"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  const totalInvitations = gameInvitations.length + friendRequests.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Invitations</h1>
          <p className="text-sm text-gray-400">{totalInvitations} en attente</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('parties')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'parties'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Parties ({gameInvitations.length})
        </button>
        <button
          onClick={() => setActiveTab('amis')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'amis'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Amis ({friendRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('club')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'club'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Club (0)
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : activeTab === 'parties' ? (
        gameInvitations.length > 0 ? (
          <div className="space-y-4">
            {gameInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={senderData[invitation.sender_id]}
                      size="lg"
                      className="border-2 border-amber-500/30"
                    />
                    <div>
                      <h3 className="font-semibold text-white">
                        {senderData[invitation.sender_id]?.full_name || 'Joueur'}
                      </h3>
                      <p className="text-sm text-gray-400">vous invite à jouer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(invitation.created_date), { addSuffix: true, locale: fr })}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-white/10 text-white border-white/20">
                    {invitation.game_type === 'chess' ? (
                      <><Crown className="w-3 h-3 mr-1 text-amber-400" /> Échecs</>
                    ) : (
                      <><Circle className="w-3 h-3 mr-1 text-blue-400" /> Dames</>
                    )}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptGame(invitation)}
                    className="flex-1 bg-green-600 hover:bg-green-500"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accepter
                  </Button>
                  <Button
                    onClick={() => handleDeclineGame(invitation.id)}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-bold text-white mb-2">Aucune invitation de partie</h2>
            <p className="text-gray-400">Vous n'avez pas d'invitations en attente</p>
          </div>
        )
      ) : activeTab === 'amis' ? (
        friendRequests.length > 0 ? (
          <div className="space-y-4">
            {friendRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={senderData[request.sender_id]}
                      size="lg"
                      className="border-2 border-blue-500/30"
                    />
                    <div>
                      <h3 className="font-semibold text-white">
                        {senderData[request.sender_id]?.full_name || 'Utilisateur'}
                      </h3>
                      <p className="text-sm text-gray-400">vous demande en ami</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(request.created_date), { addSuffix: true, locale: fr })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptFriend(request.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accepter
                  </Button>
                  <Button
                    onClick={() => handleDeclineFriend(request.id)}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-bold text-white mb-2">Aucune demande d'ami</h2>
            <p className="text-gray-400">Vous n'avez pas de demandes en attente</p>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Aucune invitation de club</h2>
          <p className="text-gray-400">Vous n'avez pas d'invitations de club</p>
        </div>
      )}
    </div>
  );
}