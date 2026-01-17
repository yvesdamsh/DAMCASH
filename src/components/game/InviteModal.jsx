import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function InviteModal({ isOpen, onClose, opponent, onSendInvite }) {
  const [gameType, setGameType] = useState('chess');
  const [timeControl, setTimeControl] = useState('blitz');
  const [playerColor, setPlayerColor] = useState('random');
  const [ranked, setRanked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendInvite = async () => {
    setLoading(true);
    try {
      await onSendInvite({
        game_type: gameType,
        time_control: timeControl,
        player_color: playerColor,
        ranked
      });
      handleClose();
    } catch (error) {
      console.error('Erreur envoi invitation:', error);
      alert('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGameType('chess');
    setTimeControl('blitz');
    setPlayerColor('random');
    setRanked(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#5D3A1A] border-[#D4A574]/30 text-[#F5E6D3] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#F5E6D3]">Inviter {opponent?.username}</DialogTitle>
          <DialogDescription className="text-[#D4A574]/70">
            Configurez les paramètres de la partie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type de jeu */}
          <div>
            <label className="block text-sm font-medium text-[#F5E6D3] mb-2">Type de jeu</label>
            <Select value={gameType} onValueChange={setGameType}>
              <SelectTrigger className="bg-[#2C1810] border-[#D4A574]/30 text-[#F5E6D3]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#5D3A1A] border-[#D4A574]/30 text-[#F5E6D3]">
                <SelectItem value="chess">♔ Échecs</SelectItem>
                <SelectItem value="checkers">⚫ Dames</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contrôle du temps */}
          <div>
            <label className="block text-sm font-medium text-[#F5E6D3] mb-2">Contrôle du temps</label>
            <Select value={timeControl} onValueChange={setTimeControl}>
              <SelectTrigger className="bg-[#2C1810] border-[#D4A574]/30 text-[#F5E6D3]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#5D3A1A] border-[#D4A574]/30 text-[#F5E6D3]">
                <SelectItem value="bullet">Bullet (1 min)</SelectItem>
                <SelectItem value="blitz">Blitz (3 min)</SelectItem>
                <SelectItem value="rapid">Rapide (10 min)</SelectItem>
                <SelectItem value="classic">Classique (30+ min)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-[#F5E6D3] mb-2">Couleur</label>
            <Select value={playerColor} onValueChange={setPlayerColor}>
              <SelectTrigger className="bg-[#2C1810] border-[#D4A574]/30 text-[#F5E6D3]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#5D3A1A] border-[#D4A574]/30 text-[#F5E6D3]">
                <SelectItem value="white">⚪ Blanc</SelectItem>
                <SelectItem value="black">⚫ Noir</SelectItem>
                <SelectItem value="random">🎲 Aléatoire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partie classée */}
          <div className="flex items-center justify-between rounded-lg bg-[#2C1810] border border-[#D4A574]/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[#F5E6D3]">Partie classée</p>
              <p className="text-xs text-[#D4A574]/70">Impacte le classement</p>
            </div>
            <Switch checked={ranked} onCheckedChange={setRanked} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 border-[#D4A574]/30 text-[#F5E6D3] hover:bg-white/5"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSendInvite}
            disabled={loading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? 'Envoi...' : 'Envoyer invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}