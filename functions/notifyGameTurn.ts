import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { gameSessionId, currentPlayerEmail, currentPlayerName, opponentName, gameType, roomId } = await req.json();

    if (!gameSessionId || !currentPlayerEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vérifier si le joueur est actif (vérifié via base44)
    const isActive = await checkPlayerActivity(currentPlayerEmail, base44);

    if (!isActive) {
      // Envoyer notification si inactif depuis plus de 5 minutes
      const actionLink = `GameRoom?roomId=${roomId}`;
      
      await base44.asServiceRole.functions.invoke('sendNotification', {
        userEmail: currentPlayerEmail,
        notificationType: 'game_turn',
        title: `⏱️ C'est votre tour!`,
        message: `${opponentName || 'Votre adversaire'} vous attend pour jouer une partie de ${gameType === 'chess' ? '♟️ Échecs' : '⚫ Dames'}`,
        actionLink,
        relatedEntityId: gameSessionId,
        relatedEntityType: 'game'
      });

      return Response.json({ success: true, notified: true });
    }

    return Response.json({ success: true, notified: false, reason: 'Player active' });
  } catch (error) {
    console.error('Game turn notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkPlayerActivity(playerEmail, base44) {
  try {
    const onlineUsers = await base44.asServiceRole.entities.OnlineUser.filter({
      user_id: playerEmail
    });
    
    if (!onlineUsers || onlineUsers.length === 0) return false;
    
    const user = onlineUsers[0];
    if (user.status !== 'online') return false;
    
    // Vérifier la dernière activité (moins de 5 minutes)
    const lastSeen = new Date(user.last_seen);
    const now = new Date();
    const inactiveMinutes = (now - lastSeen) / (1000 * 60);
    
    return inactiveMinutes < 5;
  } catch (e) {
    console.log('Activity check error:', e?.message || e);
    return false;
  }
}