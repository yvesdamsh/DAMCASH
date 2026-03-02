import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AddFriendModal({ open, onOpenChange, userId, userEmail, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        // Rechercher les utilisateurs en ligne
        const onlineUsers = await base44.entities.OnlineUser.list();
        const filtered = onlineUsers.filter(u => 
          u.username?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          u.user_id !== userId
        );
        setSearchResults(filtered);
      } catch (error) {
        toast.error('Erreur recherche');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, userId]);

  const handleSendRequest = async (targetUserId, targetEmail) => {
    try {
      // Vérifier si une amitié existe déjà
      const existingFriendships = await base44.entities.Friendship.filter({
        status: 'accepted'
      });

      const alreadyFriends = existingFriendships.some(f => 
        (f.user1 === userEmail && f.user2 === targetEmail) ||
        (f.user1 === targetEmail && f.user2 === userEmail)
      );

      if (alreadyFriends) {
        toast.info('Vous êtes déjà amis');
        return;
      }

      // Envoyer la demande
      await base44.entities.FriendRequest.create({
        sender_id: userId,
        sender_email: userEmail,
        receiver_id: targetUserId,
        receiver_email: targetEmail,
        status: 'pending'
      });

      // Notification
      await base44.entities.Notification?.create?.({
        user_email: targetEmail,
        type: 'friend_request',
        title: `👋 Demande d'ami`,
        message: `${userEmail?.split('@')[0]} vous a envoyé une demande d'ami`,
        is_read: false,
        from_user: userEmail
      });

      setSentRequests([...sentRequests, targetUserId]);
      toast.success('Demande envoyée!');
    } catch (error) {
      console.error(error);
      toast.error('Erreur envoi demande');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#D4A574]" />
            Ajouter un ami
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#D4A574]/50" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-[#D4A574]/30 text-white placeholder:text-[#D4A574]/50"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#D4A574]" />
            </div>
          )}

          {!loading && searchResults.length === 0 && searchQuery && (
            <p className="text-center text-[#D4A574]/50 py-8">Aucun utilisateur trouvé</p>
          )}

          {!loading && searchResults.length === 0 && !searchQuery && (
            <p className="text-center text-[#D4A574]/50 py-8">Commencez à taper pour chercher</p>
          )}

          <div className="space-y-2 max-h-80 overflow-auto">
            {searchResults.map((user, idx) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 bg-white/5 border border-[#D4A574]/20 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5A2B] flex items-center justify-center font-bold text-xs">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#F5E6D3] truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-[#D4A574]/50">
                      {user.status === 'online' ? '🟢 En ligne' : '⚫ Hors ligne'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSendRequest(user.user_id, user.username)}
                  disabled={sentRequests.includes(user.user_id)}
                  size="sm"
                  className={`text-xs h-8 ${
                    sentRequests.includes(user.user_id)
                      ? 'bg-green-600/50 text-green-300'
                      : 'bg-[#D4A574] text-[#2C1810] hover:opacity-90'
                  }`}
                >
                  {sentRequests.includes(user.user_id) ? '✓ Envoyé' : 'Ajouter'}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}