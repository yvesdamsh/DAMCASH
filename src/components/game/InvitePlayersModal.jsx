import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Search, Link as LinkIcon, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function InvitePlayersModal({ open, onOpenChange, gameType, roomId, creatorId, creatorEmail, creatorName }) {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Générer le code d'invitation
  const generateCode = async () => {
    if (inviteCode) return; // Déjà généré
    
    setCodeLoading(true);
    try {
      // Générer un code unique (8 caractères alphanumériques)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Créer l'entrée InviteCode
      await base44.entities.InviteCode.create({
        code,
        creator_id: creatorId,
        creator_email: creatorEmail,
        creator_name: creatorName,
        game_type: gameType,
        room_id: roomId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      setInviteCode(code);
      toast.success('Code généré');
    } catch (error) {
      toast.error('Erreur génération code');
    } finally {
      setCodeLoading(false);
    }
  };

  // Copier le code
  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopySuccess(true);
    toast.success('Code copié');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Rechercher des joueurs
  const searchPlayers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Rechercher dans OnlineUser par username
      const results = await base44.entities.OnlineUser.list();
      const filtered = results.filter(u => 
        u.username.toLowerCase().includes(query.toLowerCase()) && 
        u.user_id !== creatorId // Exclure le créateur
      );
      setSearchResults(filtered);
    } catch (error) {
      toast.error('Erreur recherche');
    } finally {
      setSearchLoading(false);
    }
  };

  // Inviter un joueur
  const invitePlayer = async (player) => {
    if (invitedUsers.find(u => u.user_id === player.user_id)) {
      toast.info('Déjà invité');
      return;
    }

    try {
      // Créer une GameInvitation
      await base44.entities.GameInvitation.create({
        sender_id: creatorId,
        receiver_id: player.user_id,
        game_type: gameType,
        room_id: roomId,
        status: 'pending'
      });

      // Créer une notification
      await base44.entities.Notification.create({
        user_email: player.user_id,
        type: 'game_invitation',
        title: `🎮 ${creatorName} vous invite à jouer`,
        message: `Invité pour une partie de ${gameType === 'chess' ? '♟️ Échecs' : '⚫ Dames'}`,
        is_read: false,
        from_user: creatorEmail,
        link: `GameRoom?roomId=${roomId}`
      });

      setInvitedUsers([...invitedUsers, player]);
      toast.success(`Invitation envoyée à ${player.username}`);
    } catch (error) {
      toast.error('Erreur invitation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Inviter des joueurs</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1a0f0f]">
            <TabsTrigger value="search" className="flex items-center gap-2 text-xs">
              <Search className="w-4 h-4" />
              Rechercher
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2 text-xs">
              <LinkIcon className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="invited" className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4" />
              Invités ({invitedUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB: Rechercher des joueurs */}
          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Input
                placeholder="Rechercher un joueur..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchPlayers(e.target.value);
                }}
                className="bg-white/5 border-[#D4A574]/30 text-white placeholder:text-[#D4A574]/50"
              />
              
              {searchLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#D4A574]" />
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && searchQuery && (
                <p className="text-center text-[#D4A574]/50 py-6">Aucun joueur trouvé</p>
              )}

              <div className="space-y-2 max-h-64 overflow-auto">
                {searchResults.map((player) => (
                  <motion.div
                    key={player.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-white/5 border border-[#D4A574]/20 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5A2B] flex items-center justify-center text-xs font-bold">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{player.username}</p>
                        <p className="text-xs text-[#D4A574]/50">
                          {player.status === 'online' ? '🟢 En ligne' : '⚫ Hors ligne'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => invitePlayer(player)}
                      disabled={invitedUsers.some(u => u.user_id === player.user_id)}
                      size="sm"
                      className={`${
                        invitedUsers.some(u => u.user_id === player.user_id)
                          ? 'bg-green-600/50 text-green-300'
                          : 'bg-[#D4A574] text-[#2C1810] hover:bg-[#D4A574]/90'
                      }`}
                    >
                      {invitedUsers.some(u => u.user_id === player.user_id) ? '✓ Invité' : 'Inviter'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB: Code d'invitation */}
          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-[#D4A574]/70">
                Générez un code unique pour inviter des joueurs à rejoindre cette partie
              </p>

              {!inviteCode ? (
                <Button
                  onClick={generateCode}
                  disabled={codeLoading}
                  className="w-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] font-bold hover:opacity-90"
                >
                  {codeLoading ? 'Génération...' : '🔗 Générer un code'}
                </Button>
              ) : (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-6 bg-gradient-to-br from-[#D4A574]/10 to-[#8B5A2B]/10 border-2 border-[#D4A574]/30 rounded-xl text-center space-y-4"
                >
                  <p className="text-xs text-[#D4A574]/70 uppercase tracking-wider font-semibold">Code d'invitation</p>
                  <div className="flex items-center justify-center gap-3">
                    <code className="text-3xl font-black text-[#D4A574] tracking-widest select-all">
                      {inviteCode}
                    </code>
                    <Button
                      onClick={copyCode}
                      size="sm"
                      className={`transition-all ${
                        copySuccess
                          ? 'bg-green-600 text-white'
                          : 'bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/40'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-[#D4A574]/50">Code valide 24h</p>
                  <p className="text-xs text-[#D4A574]/60">Les joueurs peuvent utiliser ce code pour rejoindre</p>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* TAB: Joueurs invités */}
          <TabsContent value="invited" className="space-y-4 mt-4">
            {invitedUsers.length === 0 ? (
              <p className="text-center text-[#D4A574]/50 py-8">Aucun joueur invité pour le moment</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {invitedUsers.map((player) => (
                  <motion.div
                    key={player.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-600/50 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{player.username}</p>
                        <p className="text-xs text-green-400">✓ Invité(e)</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6 justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#D4A574] text-[#2C1810] hover:bg-[#D4A574]/90"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}