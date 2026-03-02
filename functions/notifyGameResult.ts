import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { gameResultId, winnerId, winnerEmail, winnerName, loserId, loserEmail, loserName, gameType, roomId, isDraw } = await req.json();

    if (!gameResultId || !winnerId || !loserId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const gameTypeLabel = gameType === 'chess' ? '♟️ Échecs' : '⚫ Dames';
    const actionLink = `GameRoom?roomId=${roomId}`;

    // Notification pour le gagnant
    if (!isDraw) {
      await base44.asServiceRole.functions.invoke('sendNotification', {
        userEmail: winnerEmail,
        notificationType: 'game_result',
        title: '🎉 Victoire!',
        message: `Bravo! Vous avez remporté la victoire contre ${loserName} en ${gameTypeLabel}`,
        actionLink,
        relatedEntityId: gameResultId,
        relatedEntityType: 'game'
      });

      // Notification pour le perdant
      await base44.asServiceRole.functions.invoke('sendNotification', {
        userEmail: loserEmail,
        notificationType: 'game_result',
        title: '😔 Défaite',
        message: `La partie contre ${winnerName} en ${gameTypeLabel} est terminée. ${winnerName} a remporté la victoire.`,
        actionLink,
        relatedEntityId: gameResultId,
        relatedEntityType: 'game'
      });
    } else {
      // Notifications pour un nul
      await Promise.all([
        base44.asServiceRole.functions.invoke('sendNotification', {
          userEmail: winnerEmail,
          notificationType: 'game_result',
          title: '🤝 Match nul',
          message: `La partie contre ${loserName} en ${gameTypeLabel} s'est terminée par un nul.`,
          actionLink,
          relatedEntityId: gameResultId,
          relatedEntityType: 'game'
        }),
        base44.asServiceRole.functions.invoke('sendNotification', {
          userEmail: loserEmail,
          notificationType: 'game_result',
          title: '🤝 Match nul',
          message: `La partie contre ${winnerName} en ${gameTypeLabel} s'est terminée par un nul.`,
          actionLink,
          relatedEntityId: gameResultId,
          relatedEntityType: 'game'
        })
      ]);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Game result notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});