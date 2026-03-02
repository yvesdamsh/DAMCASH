import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameType, opponentEmail, result, playerCurrentELO, opponentCurrentELO } = await req.json();

    if (!gameType || !opponentEmail || !result || !playerCurrentELO) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Récupérer les stats du joueur courant
    const playerStats = await base44.asServiceRole.entities.PlayerStats.filter({
      user_id: user.id
    });

    let stats = playerStats[0] || {
      user_id: user.id,
      username: user.full_name,
      chess_rating: 1200,
      checkers_rating: 1200,
      games_played: 0,
      games_won: 0,
      games_lost: 0,
      games_drawn: 0
    };

    // Calculer le changement ELO (Système ELO simple)
    const K = 32; // Facteur K standard
    const expectedScore = 1 / (1 + Math.pow(10, (opponentCurrentELO - playerCurrentELO) / 400));
    
    let ratingChange = 0;
    let newRating = playerCurrentELO;

    if (result === 'win') {
      ratingChange = Math.round(K * (1 - expectedScore));
      newRating = playerCurrentELO + ratingChange;
      stats.games_won = (stats.games_won || 0) + 1;
    } else if (result === 'loss') {
      ratingChange = Math.round(K * (0 - expectedScore));
      newRating = playerCurrentELO + ratingChange;
      stats.games_lost = (stats.games_lost || 0) + 1;
    } else if (result === 'draw') {
      ratingChange = Math.round(K * (0.5 - expectedScore));
      newRating = playerCurrentELO + ratingChange;
      stats.games_drawn = (stats.games_drawn || 0) + 1;
    }

    // Mise à jour du rating selon le type de jeu
    const ratingField = gameType === 'chess' ? 'chess_rating' : 'checkers_rating';
    stats[ratingField] = Math.max(0, newRating); // Minimum 0
    stats.games_played = (stats.games_played || 0) + 1;

    // Sauvegarder les stats
    if (playerStats[0]?.id) {
      await base44.asServiceRole.entities.PlayerStats.update(playerStats[0].id, stats);
    } else {
      await base44.asServiceRole.entities.PlayerStats.create(stats);
    }

    // Enregistrer l'historique ELO
    await base44.asServiceRole.entities.ELORating.create({
      user_id: user.id,
      game_type: gameType,
      rating_before: playerCurrentELO,
      rating_after: newRating,
      rating_change: ratingChange,
      opponent_rating: opponentCurrentELO || 1200,
      timestamp: new Date().toISOString()
    });

    // Récupérer les stats de l'adversaire et mettre à jour aussi
    try {
      const opponentUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
      const opponent = opponentUsers.find(u => u.email === opponentEmail);
      
      if (opponent) {
        const opponentStats = await base44.asServiceRole.entities.PlayerStats.filter({
          user_id: opponent.id
        });

        let oppStats = opponentStats[0] || {
          user_id: opponent.id,
          username: opponent.full_name,
          chess_rating: 1200,
          checkers_rating: 1200,
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          games_drawn: 0
        };

        // Calcul inverse pour l'adversaire
        const oppExpectedScore = 1 / (1 + Math.pow(10, (playerCurrentELO - opponentCurrentELO) / 400));
        let oppRatingChange = 0;
        let oppNewRating = opponentCurrentELO;

        if (result === 'win') {
          oppRatingChange = Math.round(K * (0 - oppExpectedScore));
          oppNewRating = opponentCurrentELO + oppRatingChange;
          oppStats.games_lost = (oppStats.games_lost || 0) + 1;
        } else if (result === 'loss') {
          oppRatingChange = Math.round(K * (1 - oppExpectedScore));
          oppNewRating = opponentCurrentELO + oppRatingChange;
          oppStats.games_won = (oppStats.games_won || 0) + 1;
        } else if (result === 'draw') {
          oppRatingChange = Math.round(K * (0.5 - oppExpectedScore));
          oppNewRating = opponentCurrentELO + oppRatingChange;
          oppStats.games_drawn = (oppStats.games_drawn || 0) + 1;
        }

        oppStats[ratingField] = Math.max(0, oppNewRating);
        oppStats.games_played = (oppStats.games_played || 0) + 1;

        if (opponentStats[0]?.id) {
          await base44.asServiceRole.entities.PlayerStats.update(opponentStats[0].id, oppStats);
        } else {
          await base44.asServiceRole.entities.PlayerStats.create(oppStats);
        }

        // Historique adversaire
        await base44.asServiceRole.entities.ELORating.create({
          user_id: opponent.id,
          game_type: gameType,
          rating_before: opponentCurrentELO,
          rating_after: oppNewRating,
          rating_change: oppRatingChange,
          opponent_rating: playerCurrentELO,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.log('Opponent ELO update error:', err?.message || err);
    }

    return Response.json({
      success: true,
      newRating: newRating,
      ratingChange: ratingChange,
      message: `Rating mis à jour: ${playerCurrentELO} → ${newRating} (${ratingChange > 0 ? '+' : ''}${ratingChange})`
    });
  } catch (error) {
    console.error('ELO update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});