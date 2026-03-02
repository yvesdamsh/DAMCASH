import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InviteToGameModal({ open, onOpenChange, friendEmail, friendName }) {
  const [gameType, setGameType] = useState('chess');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInvite = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();

      // Créer une GameSession
      const gameSession = await base44.entities.GameSession.create({
        room_id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        player1_id: user.id,
        player1_email: user.email,
        player1_name: user.full_name,
        game_type: gameType,
        status: 'waiting',
        time_control: 'classic',
        white_time: 1800,
        black_time: 1800,
        has_wager: false
      });

      // Créer une GameInvitation
      await base44.entities.GameInvitation.create({
        sender_id: user.id,
        receiver_id: friendEmail,
        game_type: gameType,
        room_id: gameSession.room_id,
        status: 'pending'
      });

      // Envoyer une notification
      await base44.entities.Notification?.create?.({
        user_email: friendEmail,
        type: 'game_invitation',
        title: `🎮 ${user.full_name} vous invite à jouer`,
        message: `Invitation pour une partie de ${gameType === 'chess' ? '♟️ Échecs' : '⚫ Dames'}`,
        is_read: false,
        from_user: user.email,
        link: `GameRoom?roomId=${gameSession.room_id}`
      });

      toast.success(`Invitation envoyée à ${friendName}`);
      onOpenChange(false);
      
      // Rediriger vers la salle de jeu
      navigate(`${createPageUrl('GameRoom')}?roomId=${gameSession.room_id}&waiting=true`);
    } catch (error) {
      console.error(error);
      toast.error('Erreur invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Inviter {friendName} à jouer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-[#F5E6D3]">Type de jeu</Label>
            <RadioGroup value={gameType} onValueChange={setGameType}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-[#D4A574]/20 hover:border-[#D4A574]/40 cursor-pointer transition-all">
                <RadioGroupItem value="chess" id="chess" />
                <Label htmlFor="chess" className="cursor-pointer flex-1 font-semibold">
                  ♟️ Échecs
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-[#D4A574]/20 hover:border-[#D4A574]/40 cursor-pointer transition-all">
                <RadioGroupItem value="checkers" id="checkers" />
                <Label htmlFor="checkers" className="cursor-pointer flex-1 font-semibold">
                  ⚫ Dames
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 border-[#D4A574]/30"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleInvite}
              className="flex-1 bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] hover:opacity-90 font-bold"
              disabled={loading}
            >
              {loading ? 'Envoi...' : '🎮 Inviter'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}