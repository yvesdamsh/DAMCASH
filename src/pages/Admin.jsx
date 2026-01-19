import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, Ban, MessageSquare, Search, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, tournamentsActive: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Vérifier si admin
      if (currentUser?.email === 'yves.ahipo@gmail.com' || currentUser?.isAdmin) {
        setIsAdmin(true);
        loadAdminData();
      } else {
        toast.error('Accès refusé');
        setTimeout(() => navigate('/Home'), 2000);
      }
    } catch (error) {
      navigate('/Home');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Charger tous les utilisateurs
      const allUsers = await base44.entities.User.list('-updated_date');
      setUsers(allUsers || []);

      // Charger tous les tournois
      const allTournaments = await base44.entities.Tournament.list('-created_date');
      setTournaments(allTournaments || []);

      // Calculer les stats
      const activeUsers = allUsers?.filter(u => {
        const lastSeen = new Date(u.updated_date);
        const today = new Date();
        return lastSeen.toDateString() === today.toDateString();
      }) || [];

      const activeTournaments = allTournaments?.filter(t => t.status === 'in_progress') || [];

      setStats({
        totalUsers: allUsers?.length || 0,
        activeToday: activeUsers.length,
        tournamentsActive: activeTournaments.length
      });
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !modalData.messageContent) return;

    try {
      setLoading(true);
      await base44.entities.Message.create({
        sender_id: user.id,
        sender_name: 'Admin',
        receiver_id: selectedUser.id,
        receiver_name: selectedUser.full_name,
        content: `[ADMIN] ${modalData.messageContent}`,
        is_read: false
      });

      toast.success('Message envoyé');
      setModalType(null);
      setModalData({});
    } catch (error) {
      toast.error('Erreur envoi du message');
    } finally {
      setLoading(false);
    }
  };

  const handleWarnUser = async () => {
    if (!selectedUser || !modalData.warnReason) return;

    try {
      setLoading(true);
      await base44.entities.Notification.create({
        user_email: selectedUser.email,
        type: 'admin_warning',
        title: '⚠️ Avertissement Administrateur',
        message: `Raison: ${modalData.warnReason}`
      });

      await base44.entities.Message.create({
        sender_id: user.id,
        sender_name: 'Admin',
        receiver_id: selectedUser.id,
        receiver_name: selectedUser.full_name,
        content: `[AVERTISSEMENT ADMIN] ${modalData.warnReason}`,
        is_read: false
      });

      toast.success('Avertissement envoyé');
      setModalType(null);
      setModalData({});
    } catch (error) {
      toast.error('Erreur envoi de l\'avertissement');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !modalData.banReason) return;

    try {
      setLoading(true);
      await base44.auth.updateMe({ banned_users: [...(user.banned_users || []), selectedUser.id] });

      await base44.entities.Notification.create({
        user_email: selectedUser.email,
        type: 'admin_ban',
        title: '🚫 Compte Banni',
        message: `Raison: ${modalData.banReason}`
      });

      toast.success('Utilisateur banni');
      loadAdminData();
      setModalType(null);
      setModalData({});
    } catch (error) {
      toast.error('Erreur bannissement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 border-b-2 border-red-600">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔒</div>
            <h1 className="text-3xl font-black text-white">PANNEAU ADMINISTRATEUR</h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/Home')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '👥', label: 'Utilisateurs totaux', value: stats.totalUsers },
            { icon: '🟢', label: 'Actifs aujourd\'hui', value: stats.activeToday },
            { icon: '🏆', label: 'Tournois actifs', value: stats.tournamentsActive }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-lg p-4"
            >
              <p className="text-2xl mb-2">{stat.icon}</p>
              <p className="text-xs text-red-300 font-semibold">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-red-500/30 rounded-lg p-1 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              👥 Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-2">
              🏆 Tournois
            </TabsTrigger>
          </TabsList>

          {/* Onglet Utilisateurs */}
          <TabsContent value="users" className="bg-transparent">
            <div className="bg-white/5 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Search className="w-5 h-5 text-red-400" />
                <Input
                  placeholder="Chercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border-red-500/30 text-[#F5E6D3]"
                />
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-white/5 border border-red-500/20 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback className="bg-red-600 text-xs">{u.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{u.full_name}</p>
                          <p className="text-xs text-red-300">{u.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-500/20 text-blue-300 border-0">Lvl {u.level || 1}</Badge>
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-0">{u.gems || 0} 💎</Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType('message');
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType('warn');
                          }}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-700 hover:bg-red-800 text-white"
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType('ban');
                          }}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Onglet Tournois */}
          <TabsContent value="tournaments" className="bg-transparent">
            <div className="bg-white/5 border border-red-500/30 rounded-lg p-6">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {tournaments.map((t) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white/5 border border-red-500/20 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{t.name}</p>
                          <p className="text-xs text-red-300">Créé par: {t.creator_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={`border-0 ${t.status === 'in_progress' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                            {t.status === 'in_progress' ? '🟢' : '⚪'} {t.status}
                          </Badge>
                          <Badge className="bg-purple-500/20 text-purple-300 border-0">{t.participants?.length || 0} / {t.max_participants}</Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Message */}
      <Dialog open={modalType === 'message'} onOpenChange={() => setModalType(null)}>
        <DialogContent className="bg-[#2C1810] border-red-500/50">
          <DialogHeader>
            <DialogTitle className="text-red-400">💬 Envoyer un message</DialogTitle>
            <DialogDescription className="text-red-300">à {selectedUser?.full_name}</DialogDescription>
          </DialogHeader>
          <div>
            <textarea
              value={modalData.messageContent || ''}
              onChange={(e) => setModalData({ ...modalData, messageContent: e.target.value })}
              placeholder="Votre message..."
              className="w-full bg-white/5 border border-red-500/30 text-[#F5E6D3] rounded-lg p-3 h-24 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>Annuler</Button>
            <Button onClick={handleSendMessage} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Warn */}
      <Dialog open={modalType === 'warn'} onOpenChange={() => setModalType(null)}>
        <DialogContent className="bg-[#2C1810] border-red-500/50">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">⚠️ Avertir utilisateur</DialogTitle>
            <DialogDescription className="text-yellow-300">{selectedUser?.full_name}</DialogDescription>
          </DialogHeader>
          <div>
            <textarea
              value={modalData.warnReason || ''}
              onChange={(e) => setModalData({ ...modalData, warnReason: e.target.value })}
              placeholder="Raison de l'avertissement..."
              className="w-full bg-white/5 border border-red-500/30 text-[#F5E6D3] rounded-lg p-3 h-24 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>Annuler</Button>
            <Button onClick={handleWarnUser} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Avertir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ban */}
      <Dialog open={modalType === 'ban'} onOpenChange={() => setModalType(null)}>
        <DialogContent className="bg-[#2C1810] border-red-500/50">
          <DialogHeader>
            <DialogTitle className="text-red-600">🚫 Bannir utilisateur</DialogTitle>
            <DialogDescription className="text-red-400">{selectedUser?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-300">⚠️ Cette action est irréversible. L'utilisateur sera banni de la plateforme.</p>
          </div>
          <div>
            <textarea
              value={modalData.banReason || ''}
              onChange={(e) => setModalData({ ...modalData, banReason: e.target.value })}
              placeholder="Raison du bannissement..."
              className="w-full bg-white/5 border border-red-500/30 text-[#F5E6D3] rounded-lg p-3 h-24 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>Annuler</Button>
            <Button onClick={handleBanUser} disabled={loading} className="bg-red-700 hover:bg-red-800">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Confirmer bannissement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}