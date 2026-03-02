import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Users, Clock, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import FriendCard from '../components/friends/FriendCard';
import FriendRequestCard from '../components/friends/FriendRequestCard';
import AddFriendModal from '../components/friends/AddFriendModal';

export default function Friends() {
  const [user, setUser] = useState(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Charger les amis acceptés
  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await base44.entities.Friendship.filter({
        status: 'accepted'
      });
      return results.filter(f => f.user1 === user.email || f.user2 === user.email);
    },
    enabled: !!user?.id
  });

  // Charger les demandes en attente
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pendingRequests', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await base44.entities.FriendRequest.filter({
        receiver_id: user.id,
        status: 'pending'
      });
      return results;
    }
  });

  // Charger les statuts en ligne
  const { data: onlineStatuses = {} } = useQuery({
    queryKey: ['onlineStatuses', friendships],
    queryFn: async () => {
      const statuses = {};
      const friendIds = friendships.map(f => f.user1 === user?.email ? f.user2 : f.user1);
      
      for (const friendEmail of friendIds) {
        const onlineUsers = await base44.entities.OnlineUser.list();
        const onlineUser = onlineUsers.find(u => u.user_id);
        if (onlineUser) {
          statuses[friendEmail] = onlineUser.status === 'online';
        }
      }
      return statuses;
    },
    refetchInterval: 10000 // Rafraîchir tous les 10s
  });

  // Accepter une demande
  const handleAcceptRequest = async (requestId, senderId, senderEmail) => {
    try {
      await base44.entities.FriendRequest.update(requestId, { status: 'accepted' });
      
      // Créer la friendship
      await base44.entities.Friendship.create({
        user1: user.email,
        user2: senderEmail,
        status: 'accepted'
      });

      queryClient.invalidateQueries({ queryKey: ['pendingRequests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendships', user?.id] });
      
      toast.success('Ami ajouté!');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Refuser une demande
  const handleDeclineRequest = async (requestId) => {
    try {
      await base44.entities.FriendRequest.update(requestId, { status: 'declined' });
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', user?.id] });
      toast.success('Demande refusée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Supprimer un ami
  const handleRemoveFriend = async (friendshipId) => {
    try {
      await base44.entities.Friendship.delete(friendshipId);
      queryClient.invalidateQueries({ queryKey: ['friendships', user?.id] });
      toast.success('Ami supprimé');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Obtenir les infos détaillées des amis
  const friendsList = friendships.map(f => {
    const friendEmail = f.user1 === user?.email ? f.user2 : f.user1;
    return {
      ...f,
      friendEmail,
      isOnline: onlineStatuses[friendEmail] || false
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      <style>{`
        .glass-card { background: rgba(93, 58, 26, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(212, 165, 116, 0.2); }
      `}</style>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-8 border-b border-[#D4A574]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#D4A574]" />
            <h1 className="text-3xl font-black">Amis</h1>
          </div>
          <Button
            onClick={() => setShowAddFriend(true)}
            className="bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] hover:opacity-90 font-bold flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un ami
          </Button>
        </div>
      </div>

      <AddFriendModal
        open={showAddFriend}
        onOpenChange={setShowAddFriend}
        userId={user?.id}
        userEmail={user?.email}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['friendships', user?.id] });
          setShowAddFriend(false);
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1a0f0f] mb-8">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Amis ({friendsList.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Demandes ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB: Amis */}
          <TabsContent value="friends" className="space-y-4">
            {friendsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-14 h-14 text-[#D4A574]/20 mb-4" />
                <p className="text-[#D4A574]/50 text-lg mb-4">Aucun ami pour le moment</p>
                <Button
                  onClick={() => setShowAddFriend(true)}
                  className="bg-[#D4A574] text-[#2C1810] hover:opacity-90"
                >
                  Commencer à ajouter des amis
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {friendsList.map((friend, idx) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <FriendCard
                        friend={friend}
                        isOnline={friend.isOnline}
                        onRemove={() => handleRemoveFriend(friend.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* TAB: Demandes */}
          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="w-14 h-14 text-green-500/20 mb-4" />
                <p className="text-[#D4A574]/50 text-lg">Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {pendingRequests.map((request, idx) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <FriendRequestCard
                        request={request}
                        onAccept={() => handleAcceptRequest(request.id, request.sender_id, request.sender_email || request.sender_id)}
                        onDecline={() => handleDeclineRequest(request.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}