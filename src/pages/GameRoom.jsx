import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CheckersBoard from '../components/game/CheckersBoard';
import ChessBoard from '../components/game/ChessBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [roomId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const invitations = await base44.entities.GameInvitation.filter({
        room_id: roomId
      });

      if (invitations.length > 0) {
        setInvitation(invitations[0]);
      }
    } catch (error) {
      console.error('Error loading game room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameEnd = () => {
    navigate('/Play');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <p className="text-xl">Jeu introuvable</p>
        <Button onClick={() => navigate('/Play')} className="bg-amber-600 hover:bg-amber-700">
          Retour
        </Button>
      </div>
    );
  }

  const isPlayerWhite = user.email === invitation.sender_email;
  const gameType = invitation.game_type;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-[#D4A574]/30">
        <Button
          variant="ghost"
          onClick={() => navigate('/Play')}
          className="text-[#F5E6D3] hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">
          {gameType === 'chess' ? '♔ Échecs' : '⚫ Dames'}
        </h1>
        <div className="w-20" />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {gameType === 'chess' ? (
          <ChessBoard 
            playerColor={isPlayerWhite ? 'white' : 'black'}
            onGameEnd={handleGameEnd}
          />
        ) : (
          <CheckersBoard 
            playerColor={isPlayerWhite ? 'white' : 'black'}
            onGameEnd={handleGameEnd}
          />
        )}
      </div>
    </div>
  );
}