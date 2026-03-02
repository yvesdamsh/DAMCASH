import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      gameType,        // 'chess' | 'checkers'
      opponentId,      // ID du joueur adverse
      opponentEmail,   // Email du joueur adverse
      result,          // 'win' | 'loss' | 'draw'
      playerCurrentELO,
      opponentCurrentELO
    } = await req.json();

    if (!gameType || !opponentEmail || !result) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const K = 32; // Standard K-factor

    // Calcul Expected Score
    const expectedScore = 1 / (1 + Math.pow(10, (opponentCurrentELO - playerCurrentELO) / 400));
    const expectedOpponentScore = 1 / (1 + Math.pow(10, (playerCurrentELO - opponentCurrentELO) / 400));

    // Déterminer les points réels
    let actualScore, opponentActualScore;
    if (result === 'win') {
      actualScore = 1;
      opponentActualScore = 0;
    } else if (result === 'loss') {
      actualScore = 0;
      opponentActualScore = 1;
    } else { // draw
      actualScore = 0.5;
      opponentActualScore = 0.5;
    }

    // Calculer les nouveaux ELO
    const newELO = Math.round(playerCurrentELO + K * (actualScore - expectedScore));
    const newOpponentELO = Math.round(opponentCurrentELO + K * (opponentActualScore - expectedOpponentScore));

    // Déterminer le champ à mettre à jour
    const eloField = gameType === 'chess' ? 'chess_rating' : 'checkers_rating';

    // Mettre à jour l'ELO du joueur actuel
    await base44.asServiceRole.auth.updateUserByEmail(user.email, {
      [eloField]: Math.max(0, newELO) // ELO ne peut pas être négatif
    });

    // Mettre à jour l'ELO de l'adversaire
    await base44.asServiceRole.auth.updateUserByEmail(opponentEmail, {
      [eloField]: Math.max(0, newOpponentELO)
    });

    // Créer une notification pour les deux joueurs
    await base44.asServiceRole.entities.Notification.create({
      user_email: user.email,
      type: 'game_ended',
      title: `${result === 'win' ? '🎉 Victoire!' : result === 'loss' ? '😔 Défaite' : '🤝 Match nul'}`,
      message: `ELO ${eloField === 'chess_rating' ? '♟' : '⚫'}: ${playerCurrentELO} → ${newELO} (${newELO > playerCurrentELO ? '+' : ''}${newELO - playerCurrentELO})`,
      is_read: false
    });

    await base44.asServiceRole.entities.Notification.create({
      user_email: opponentEmail,
      type: 'game_ended',
      title: `${result === 'loss' ? '🎉 Victoire!' : result === 'win' ? '😔 Défaite' : '🤝 Match nul'}`,
      message: `ELO ${eloField === 'chess_rating' ? '♟' : '⚫'}: ${opponentCurrentELO} → ${newOpponentELO} (${newOpponentELO > opponentCurrentELO ? '+' : ''}${newOpponentELO - opponentCurrentELO})`,
      is_read: false
    });

    return Response.json({
      success: true,
      playerNewELO: newELO,
      playerELOChange: newELO - playerCurrentELO,
      opponentNewELO: newOpponentELO,
      opponentELOChange: newOpponentELO - opponentCurrentELO
    });
  } catch (error) {
    console.error('ELO Update Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});