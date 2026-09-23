import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Appelé quand un joueur perd aux points de temps (timeout)
// Termine la partie et attribue la victoire à l'adversaire
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, losingColor } = await req.json();

    if (!roomId || !losingColor) {
      return Response.json({ error: 'Missing roomId or losingColor' }, { status: 400 });
    }

    // Charger la session
    const sessions = await base44.asServiceRole.entities.GameSession.filter({ room_id: roomId });
    if (!sessions.length) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessions[0];

    if (session.status === 'finished') {
      return Response.json({ message: 'Game already finished' });
    }

    // Déterminer gagnant / perdant
    const loserIsPlayer1 = losingColor === 'white';
    const winnerId = loserIsPlayer1 ? session.player2_id : session.player1_id;
    const winnerEmail = loserIsPlayer1 ? session.player2_email : session.player1_email;
    const winnerName = loserIsPlayer1 ? session.player2_name : session.player1_name;
    const loserId = loserIsPlayer1 ? session.player1_id : session.player2_id;
    const loserEmail = loserIsPlayer1 ? session.player1_email : session.player2_email;
    const loserName = loserIsPlayer1 ? session.player1_name : session.player2_name;

    // Marquer la session comme terminée
    await base44.asServiceRole.entities.GameSession.update(session.id, {
      status: 'finished',
      winner: winnerId
    });

    // Enregistrer le résultat
    await base44.asServiceRole.entities.GameResult.create({
      room_id: roomId,
      game_type: session.game_type,
      winner_id: winnerId,
      loser_id: loserId,
      player1_id: session.player1_id,
      player1_name: session.player1_name,
      player2_id: session.player2_id,
      player2_name: session.player2_name,
      result: losingColor === 'white' ? 'black' : 'white'
    });

    // Notifier les joueurs
    await Promise.all([
      base44.asServiceRole.entities.Notification.create({
        user_email: winnerEmail,
        type: 'game_ended',
        title: '⏱ Victoire par timeout !',
        message: `${loserName} a manqué de temps. Vous remportez la partie !`,
        is_read: false,
        link: `GameRoom?roomId=${roomId}`
      }),
      base44.asServiceRole.entities.Notification.create({
        user_email: loserEmail,
        type: 'game_ended',
        title: '⏱ Défaite par timeout',
        message: `Votre temps de réflexion est écoulé. ${winnerName} remporte la partie.`,
        is_read: false,
        link: `GameRoom?roomId=${roomId}`
      })
    ]);

    // Déclencher les récompenses
    await base44.asServiceRole.functions.invoke('awardGameRewards', {
      winnerId,
      winnerEmail,
      winnerName,
      loserId,
      loserEmail,
      loserName,
      gameType: session.game_type,
      isDraw: false,
      isRanked: true,
      roomId
    });

    return Response.json({
      success: true,
      winner: winnerName,
      loser: loserName,
      reason: 'timeout'
    });
  } catch (error) {
    console.error('handleGameTimeout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});