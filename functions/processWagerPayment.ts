import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      gameResultId,
      winnerId,
      wagerAmount
    } = await req.json();

    if (!gameResultId || !winnerId || !wagerAmount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vérifier que c'est bien le gagnant qui demande le paiement
    if (user.id !== winnerId) {
      return Response.json({ error: 'Only winner can process payment' }, { status: 403 });
    }

    // Calculer les montants
    const commission = Math.round(wagerAmount * 0.1 * 100) / 100; // 10% commission
    const winnerPayout = Math.round((wagerAmount - commission) * 100) / 100;

    // Mettre à jour GameResult
    await base44.entities.GameResult.update(gameResultId, {
      winner_payout: winnerPayout,
      damcash_commission: commission,
      payment_processed: true
    });

    // INTÉGRATION STRIPE (à venir): 
    // - Débiter le perdant de wagerAmount
    // - Créditer le gagnant de winnerPayout
    // - Commission DamCash reste dans le compte merchant
    
    // Pour maintenant: créer une notification
    await base44.entities.Notification?.create?.({
      user_email: user.email,
      type: 'payment',
      title: `💰 Paiement confirmé`,
      message: `+${winnerPayout}€ reçu (commission -${commission}€)`,
      is_read: false
    });

    return Response.json({
      success: true,
      wagerAmount,
      commission,
      winnerPayout,
      status: 'pending_stripe_integration'
    });
  } catch (error) {
    console.error('Wager Payment Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});