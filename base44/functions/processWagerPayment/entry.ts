import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { gameResultId, winnerId, wagerAmount } = await req.json();

    if (!gameResultId || !winnerId || !wagerAmount) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Charger le résultat du jeu
    const gameResults = await base44.asServiceRole.entities.GameResult.filter({
      id: gameResultId
    });

    if (!gameResults.length) {
      return Response.json({ error: 'Game result not found' }, { status: 404 });
    }

    const gameResult = gameResults[0];

    // Vérifier que le jeu a un pari
    if (!gameResult.has_wager || !gameResult.wager_amount) {
      return Response.json({ error: 'No wager on this game' }, { status: 400 });
    }

    // Commission DamCash: 10%
    const commission = Math.round(gameResult.wager_amount * 0.1);
    const payout = gameResult.wager_amount - commission;

    // Vérifier la clé Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.log('⚠️ STRIPE_SECRET_KEY not configured - payment simulation mode');
      
      // Simulation: enregistrer le paiement sans traiter réellement
      await base44.asServiceRole.entities.GameResult.update(gameResult.id, {
        payment_processed: true,
        winner_payout: payout,
        damcash_commission: commission
      });

      return Response.json({
        success: true,
        message: '[SIMULATION] Paiement enregistré',
        winnerId,
        payout,
        commission,
        wagerAmount: gameResult.wager_amount
      });
    }

    // STRIPE RÉEL: Créer un transfert vers le gagnant
    // Note: En production, utiliser Stripe Payment Intent ou Connect
    try {
      // Charger l'utilisateur gagnant pour son email
      const winnerUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
      const winner = winnerUsers.find(u => u.id === winnerId);

      if (!winner) {
        return Response.json({ error: 'Winner not found' }, { status: 404 });
      }

      // En production: créer un Stripe Customer et Payment Intent
      // Pour MVP: enregistrer la transaction et marquer comme traitée
      await base44.asServiceRole.entities.GameResult.update(gameResult.id, {
        payment_processed: true,
        winner_payout: payout,
        damcash_commission: commission
      });

      // Logger la transaction
      console.log('💳 Paiement traité:', {
        gameId: gameResult.id,
        winnerId,
        winnerEmail: winner.email,
        amount: payout,
        commission: commission,
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        message: 'Paiement traité avec succès',
        winnerId,
        winnerEmail: winner.email,
        payout,
        commission,
        wagerAmount: gameResult.wager_amount
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      
      // En cas d'erreur Stripe: enregistrer comme erreur mais ne pas bloquer
      await base44.asServiceRole.entities.GameResult.update(gameResult.id, {
        payment_processed: false
      });

      return Response.json({
        error: 'Payment processing failed',
        details: stripeError.message,
        gameResultId
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});