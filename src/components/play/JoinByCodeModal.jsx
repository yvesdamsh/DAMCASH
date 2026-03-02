import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function JoinByCodeModal({ open, onOpenChange }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinByCode = async () => {
    if (!code.trim()) {
      toast.error('Veuillez entrer un code');
      return;
    }

    setLoading(true);
    try {
      // Rechercher le code d'invitation
      const inviteCodes = await base44.entities.InviteCode.filter({
        code: code.toUpperCase()
      });

      if (inviteCodes.length === 0) {
        toast.error('Code invalide');
        setLoading(false);
        return;
      }

      const inviteCode = inviteCodes[0];

      // Vérifier que le code n'est pas expiré
      if (new Date(inviteCode.expires_at) < new Date()) {
        toast.error('Code expiré');
        setLoading(false);
        return;
      }

      // Vérifier que le code n'a pas été utilisé
      if (inviteCode.is_used) {
        toast.error('Code déjà utilisé');
        setLoading(false);
        return;
      }

      const user = await base44.auth.me();

      // Marquer le code comme utilisé
      await base44.entities.InviteCode.update(inviteCode.id, {
        is_used: true,
        used_by: user.email
      });

      // Mettre à jour la GameSession pour ajouter le joueur
      const sessions = await base44.entities.GameSession.filter({
        room_id: inviteCode.room_id
      });

      if (sessions.length > 0) {
        const session = sessions[0];
        
        if (!session.player2_id) {
          await base44.entities.GameSession.update(session.id, {
            player2_id: user.id,
            player2_email: user.email,
            player2_name: user.full_name,
            status: 'in_progress'
          });

          toast.success('Rejoint la partie!');
          onOpenChange(false);
          navigate(`${createPageUrl('GameRoom')}?roomId=${inviteCode.room_id}`);
        } else {
          toast.error('Cette partie a déjà deux joueurs');
        }
      } else {
        toast.error('Partie non trouvée');
      }
    } catch (error) {
      console.error('Join by code error:', error);
      toast.error('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">🔗 Rejoindre par code</DialogTitle>
          <DialogDescription className="text-[#D4A574]/70 mt-2">
            Entrez le code d'invitation partagé par votre ami
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Input
            placeholder="Ex: ABC12345"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) handleJoinByCode();
            }}
            className="bg-white/5 border-[#D4A574]/30 text-white placeholder:text-[#D4A574]/50 text-center text-lg font-mono tracking-widest"
            disabled={loading}
            maxLength="8"
          />

          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 border-[#D4A574]/30 text-[#F5E6D3]"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleJoinByCode}
              className="flex-1 bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] hover:opacity-90 font-bold"
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                '✓ Rejoindre'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}