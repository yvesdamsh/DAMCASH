import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Plus, Users, Lock, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ChatWindow from '../components/chat/ChatWindow';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('public');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Charger les salons
  const { data: chatRooms = [] } = useQuery({
    queryKey: ['chatRooms', user?.id],
    queryFn: async () => {
      if (!user?.email) return [];
      const results = await base44.entities.ChatRoom.list('-last_message_timestamp', 100);
      return results.filter(room => 
        room.type === 'public' || room.members?.includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  // Subscribe aux changements
  useEffect(() => {
    const unsubscribe = base44.entities.ChatRoom?.subscribe?.((event) => {
      if (event?.type === 'create' || event?.type === 'update') {
        queryClient.invalidateQueries({ queryKey: ['chatRooms', user?.id] });
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.id, queryClient]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Nom requis');
      return;
    }

    try {
      const room = await base44.entities.ChatRoom.create({
        name: newRoomName,
        type: newRoomType,
        creator_id: user.id,
        creator_email: user.email,
        members: newRoomType === 'private' ? [user.email] : undefined,
        is_active: true,
        member_count: 1
      });

      queryClient.invalidateQueries({ queryKey: ['chatRooms', user?.id] });
      setSelectedRoomId(room.id);
      setShowCreateRoom(false);
      setNewRoomName('');
      toast.success('Salon créé!');
    } catch (error) {
      toast.error('Erreur création');
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const room = chatRooms.find(r => r.id === roomId);
      if (!room.members?.includes(user.email)) {
        await base44.entities.ChatRoom.update(roomId, {
          members: [...(room.members || []), user.email],
          member_count: (room.member_count || 0) + 1
        });
        queryClient.invalidateQueries({ queryKey: ['chatRooms', user?.id] });
      }
      setSelectedRoomId(roomId);
    } catch (error) {
      toast.error('Erreur rejoindre');
    }
  };

  const selectedRoom = chatRooms.find(r => r.id === selectedRoomId);
  const publicRooms = chatRooms.filter(r => r.type === 'public');
  const privateRooms = chatRooms.filter(r => r.type === 'private');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      <style>{`
        .glass-card { background: rgba(93, 58, 26, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(212, 165, 116, 0.2); }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#D4A574]/20">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#D4A574]" />
            <h1 className="text-3xl font-black">Chat</h1>
          </div>
          <Button
            onClick={() => setShowCreateRoom(true)}
            className="bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] hover:opacity-90 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau salon
          </Button>
        </div>

        {/* Main Layout */}
        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Sidebar - Salons */}
          <div className="w-64 flex flex-col space-y-4 overflow-hidden">
            {/* Salons publics */}
            {publicRooms.length > 0 && (
              <div className="space-y-2 overflow-y-auto flex-1">
                <p className="text-xs uppercase tracking-widest text-[#D4A574]/60 px-2">Publics</p>
                {publicRooms.map((room, idx) => (
                  <motion.button
                    key={room.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      selectedRoomId === room.id
                        ? 'bg-[#D4A574]/20 border border-[#D4A574]/40'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#D4A574]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{room.name}</p>
                        <p className="text-xs text-[#D4A574]/50">{room.member_count} membres</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Salons privés */}
            {privateRooms.length > 0 && (
              <div className="space-y-2 overflow-y-auto flex-1">
                <p className="text-xs uppercase tracking-widest text-[#D4A574]/60 px-2">Privés</p>
                {privateRooms.map((room, idx) => (
                  <motion.button
                    key={room.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      selectedRoomId === room.id
                        ? 'bg-[#D4A574]/20 border border-[#D4A574]/40'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{room.name}</p>
                        <p className="text-xs text-[#D4A574]/50">{room.member_count} membres</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedRoom ? (
              <>
                {/* Room Header */}
                <div className="pb-4 border-b border-[#D4A574]/20 mb-4">
                  <div className="flex items-center gap-3">
                    {selectedRoom.type === 'public' ? (
                      <Hash className="w-6 h-6 text-[#D4A574]" />
                    ) : (
                      <Lock className="w-6 h-6 text-purple-400" />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold">{selectedRoom.name}</h2>
                      <p className="text-sm text-[#D4A574]/60">{selectedRoom.member_count} membres</p>
                    </div>
                  </div>
                  {selectedRoom.description && (
                    <p className="text-sm text-[#D4A574]/70 mt-2">{selectedRoom.description}</p>
                  )}
                </div>

                {/* Chat */}
                <div className="flex-1 min-h-0">
                  <ChatWindow
                    roomId={selectedRoom.id}
                    user={user}
                    maxHeight="calc(100vh - 300px)"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-16 h-16 text-[#D4A574]/20 mb-4" />
                <p className="text-lg text-[#D4A574]/50">Sélectionnez un salon pour commencer</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Créer Salon */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent className="bg-[#2C1810] border-[#D4A574]/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#D4A574]" />
              Créer un salon
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-semibold mb-2 block">Nom du salon</label>
              <Input
                placeholder="Ex: Stratégie, Discussions..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="bg-white/5 border-[#D4A574]/30"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'public', label: '🌍 Public', desc: 'Tous peuvent rejoindre' },
                  { value: 'private', label: '🔒 Privé', desc: 'Sur invitation' }
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => setNewRoomType(type.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      newRoomType === type.value
                        ? 'border-[#D4A574] bg-[#D4A574]/10'
                        : 'border-[#D4A574]/20 hover:border-[#D4A574]/40'
                    }`}
                  >
                    <p className="font-bold text-sm">{type.label}</p>
                    <p className="text-xs text-[#D4A574]/60">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                onClick={() => setShowCreateRoom(false)}
                variant="outline"
                className="border-[#D4A574]/30"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateRoom}
                className="bg-[#D4A574] text-[#2C1810] hover:opacity-90"
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}