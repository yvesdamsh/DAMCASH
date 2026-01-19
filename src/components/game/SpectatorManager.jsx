import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Ban, Check, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpectatorManager({ roomId, hostId, session }) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);

  useEffect(() => {
    if (!open || !roomId) return;
    loadData();

    const unsubscribe = base44.entities.SpectatorRequest?.subscribe?.((event) => {
      if (event?.data?.room_id === roomId) {
        loadData();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [open, roomId]);

  const loadData = async () => {
    try {
      const [reqs, banned] = await Promise.all([
        base44.entities.SpectatorRequest.filter({ room_id: roomId, status: 'pending' }),
        base44.entities.BannedSpectator.filter({ room_id: roomId })
      ]);
      setRequests(reqs || []);
      setBannedUsers(banned || []);
    } catch (e) {
      console.log('Erreur chargement spectateurs:', e);
    }
  };

  const handleAccept = async (request) => {
    try {
      await base44.entities.SpectatorRequest.update(request.id, { status: 'accepted' });
      
      await base44.entities.Notification?.create?.({
        user_email: request.requester_id,
        type: 'spectator_accepted',
        title: '👁️ Demande acceptée',
        message: 'Vous pouvez maintenant observer la partie',
        link: `GameRoom?roomId=${roomId}&spectate=true`,
        icon: '👁️'
      });

      toast.success('Spectateur accepté', {
        description: `${request.requester_name} peut observer la partie`,
        icon: '✅'
      });

      loadData();
    } catch (e) {
      console.log('Erreur acceptation:', e);
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const handleDecline = async (request) => {
    try {
      await base44.entities.SpectatorRequest.update(request.id, { status: 'declined' });
      
      await base44.entities.Notification?.create?.({
        user_email: request.requester_id,
        type: 'spectator_declined',
        title: '❌ Demande refusée',
        message: 'Votre demande pour observer la partie a été refusée',
        icon: '❌'
      });

      toast.info('Demande refusée', {
        description: `${request.requester_name} ne peut pas observer`,
        icon: '❌'
      });

      loadData();
    } catch (e) {
      console.log('Erreur refus:', e);
      toast.error('Erreur lors du refus');
    }
  };

  const handleBan = async (request) => {
    try {
      await Promise.all([
        base44.entities.BannedSpectator.create({
          room_id: roomId,
          banned_user_id: request.requester_id,
          banned_user_name: request.requester_name,
          banned_by: hostId
        }),
        base44.entities.SpectatorRequest.update(request.id, { status: 'declined' })
      ]);

      toast.success('Utilisateur banni', {
        description: `${request.requester_name} ne peut plus observer cette partie`,
        icon: '🚫'
      });

      loadData();
    } catch (e) {
      console.log('Erreur bannissement:', e);
      toast.error('Erreur lors du bannissement');
    }
  };

  const handleUnban = async (banned) => {
    try {
      await base44.entities.BannedSpectator.delete(banned.id);
      
      toast.success('Débannissement', {
        description: `${banned.banned_user_name} peut à nouveau observer`,
        icon: '✅'
      });

      loadData();
    } catch (e) {
      console.log('Erreur débannissement:', e);
      toast.error('Erreur lors du débannissement');
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-500/30"
      >
        <Users className="w-4 h-4 mr-2" />
        Spectateurs ({session?.spectators_count || 0})
        {requests.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Gestion des spectateurs
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Demandes en attente */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-[#D4A574]">
                Demandes en attente ({requests.length})
              </h3>
              <ScrollArea className="h-48 rounded-md bg-white/5 p-3">
                {requests.length === 0 ? (
                  <p className="text-sm text-[#D4A574] text-center py-4">Aucune demande</p>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {requests.map((req) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between bg-[#5D3A1A] p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 border-[#D4A574]">
                              <AvatarFallback className="bg-[#8B5A2B] text-[#F5E6D3]">
                                {req.requester_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{req.requester_name}</p>
                              <p className="text-xs text-[#D4A574]">Demande d'observation</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(req)}
                              className="bg-green-600 hover:bg-green-700 h-8 px-3"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDecline(req)}
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20 h-8 px-3"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleBan(req)}
                              variant="outline"
                              className="border-red-700/50 text-red-500 hover:bg-red-700/30 h-8 px-3"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Utilisateurs bannis */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-[#D4A574]">
                Utilisateurs bannis ({bannedUsers.length})
              </h3>
              <ScrollArea className="h-32 rounded-md bg-white/5 p-3">
                {bannedUsers.length === 0 ? (
                  <p className="text-sm text-[#D4A574] text-center py-4">Aucun utilisateur banni</p>
                ) : (
                  <div className="space-y-2">
                    {bannedUsers.map((banned) => (
                      <div
                        key={banned.id}
                        className="flex items-center justify-between bg-red-900/20 border border-red-500/30 p-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-400" />
                          <span className="text-sm">{banned.banned_user_name}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUnban(banned)}
                          variant="outline"
                          className="border-green-500/50 text-green-400 hover:bg-green-500/20 h-7 px-2 text-xs"
                        >
                          Débannir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                💡 Les spectateurs peuvent voir la partie et le chat, mais ne peuvent pas jouer ni envoyer de messages.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}