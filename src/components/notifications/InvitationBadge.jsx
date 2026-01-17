import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function InvitationBadge({ userId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadInvitationCount();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadInvitationCount, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadInvitationCount = async () => {
    try {
      if (!userId) return;
      
      const gameInvitations = await base44.entities.GameInvitation.filter({
        receiver_id: userId,
        status: 'pending'
      });

      const friendRequests = await base44.entities.FriendRequest.filter({
        receiver_id: userId,
        status: 'pending'
      });

      const total = (gameInvitations?.length || 0) + (friendRequests?.length || 0);
      setCount(total);
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
    }
  };

  if (count === 0) return null;

  return (
    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-[#5D3A1A]">
      {count > 9 ? '9+' : count}
    </div>
  );
}