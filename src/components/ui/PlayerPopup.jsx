import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import UserAvatar from '@/components/ui/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, UserPlus, Eye, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

/**
 * PlayerPopup — mini fenêtre flottante style lidraughts
 * Usage: <PlayerPopup playerId="..." playerName="..." onClose={() => {}}>
 *   <span>Nom du joueur</span>
 * </PlayerPopup>
 *
 * Ou en mode contrôlé: passer open + anchorRef depuis le parent.
 */
export default function PlayerPopup({ children, playerId, playerName, playerAvatar }) {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (ok) base44.auth.me().then(setCurrentUser).catch(() => {});
    });
  }, []);

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const handleOpen = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!playerId || playerId === currentUser?.id) return;
    setOpen(prev => !prev);
    if (!open) {
      // Chercher partie en cours
      try {
        const sessions = await base44.entities.GameSession.filter({ status: 'in_progress' });
        const game = sessions.find(s => s.player1_id === playerId || s.player2_id === playerId);
        setActiveGame(game || null);
      } catch {}
    }
  };

  const handleInvite = async () => {
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    setLoading(true);
    try {
      const roomId = `${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
      await base44.entities.GameSession.create({
        room_id: roomId,
        player1_id: currentUser.id,
        player1_email: currentUser.email,
        player1_name: currentUser.full_name,
        invited_player_id: playerId,
        invited_player_name: playerName,
        game_type: 'checkers',
        status: 'waiting',
        current_turn: 'white',
        time_control: 'blitz',
        white_time: 180,
        black_time: 180,
        moves: JSON.stringify([])
      });
      await base44.entities.GameInvitation.create({
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        receiver_id: playerId,
        game_type: 'checkers',
        status: 'pending',
        room_id: roomId
      });

      // Notification in-app pour que l'adversaire voie le toast en temps réel
      const onlineUsers = await base44.entities.OnlineUser.filter({ user_id: playerId });
      const receiverEmail = onlineUsers?.[0]?.user_email;
      if (receiverEmail) {
        await base44.entities.Notification.create({
          user_email: receiverEmail,
          type: 'match_invitation',
          title: '⚔️ Invitation de partie',
          message: `${currentUser.full_name} vous invite à jouer aux Dames`,
          from_user: currentUser.email,
          link: `Invitations`,
          icon: '⚔️'
        });
      }

      toast.success(`Invitation envoyée à ${playerName}`);
      setOpen(false);
      navigate(`/GameRoom?roomId=${roomId}`);
    } catch (e) {
      toast.error('Erreur lors de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    setOpen(false);
    navigate(`${createPageUrl('Profile')}?userId=${playerId}`);
  };

  const handleWatchGame = () => {
    if (!activeGame) return;
    setOpen(false);
    navigate(`/GameRoom?roomId=${activeGame.room_id}&spectate=true`);
  };

  const handleMessage = () => {
    setOpen(false);
    navigate(`${createPageUrl('Profile')}?tab=messages&userId=${playerId}`);
  };

  const isSelf = currentUser?.id === playerId;

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        onClick={handleOpen}
        className={`cursor-pointer ${!isSelf ? 'hover:underline hover:text-[#D4A574]' : ''} transition-colors`}
      >
        {children || playerName}
      </span>

      <AnimatePresence>
        {open && !isSelf && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[9999] left-0 mt-2 w-64 rounded-xl border border-[#D4A574]/30 shadow-2xl shadow-black/60"
            style={{ background: 'linear-gradient(160deg, #2C1810 0%, #3d2010 100%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4A574]/15">
              <div className="flex items-center gap-2">
                <UserAvatar
                  user={{ full_name: playerName, photoURL: playerAvatar }}
                  size="sm"
                  showOnlineIndicator={true}
                />
                <div>
                  <p className="font-bold text-[#F5E6D3] text-sm leading-tight">{playerName}</p>
                  {activeGame && (
                    <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                      En partie
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#D4A574]/50 hover:text-[#D4A574] p-1 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions */}
            <div className="p-2 space-y-1">
              {activeGame && (
                <button
                  onClick={handleWatchGame}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-green-300 hover:bg-green-900/20 transition-all text-left"
                >
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <span>Observer la partie</span>
                </button>
              )}
              {currentUser && (
                <button
                  onClick={handleInvite}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#D4A574] hover:bg-[#D4A574]/10 transition-all text-left"
                >
                  <Swords className="w-4 h-4 flex-shrink-0" />
                  <span>{loading ? 'Envoi...' : 'Inviter à jouer'}</span>
                </button>
              )}
              <button
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#F5E6D3]/80 hover:bg-white/5 transition-all text-left"
              >
                <UserPlus className="w-4 h-4 flex-shrink-0" />
                <span>Voir le profil</span>
              </button>
              {currentUser && (
                <button
                  onClick={handleMessage}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#F5E6D3]/80 hover:bg-white/5 transition-all text-left"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Envoyer un message</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}