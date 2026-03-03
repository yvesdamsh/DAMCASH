import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Récompenses après une partie terminée: XP, gems, streaks, stats profil
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      winnerId, winnerEmail, winnerName,
      loserId, loserEmail, loserName,
      gameType, isDraw, isRanked, roomId
    } = await req.json();

    if (!winnerId || !loserId || !gameType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const results = {};

    // ── Helper: update user profile ──────────────────────────────────────────
    async function updateUserRewards(userId, userEmail, isWinner, draw) {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
      const user = users.find(u => u.id === userId || u.email === userEmail);
      if (!user) return null;

      const xpGain = draw ? 20 : (isWinner ? 50 : 10);
      const gemsGain = draw ? 5 : (isWinner ? 20 : 2);
      const newXp = (user.xp || 0) + xpGain;
      const newGems = (user.gems || 0) + gemsGain;
      const newLevel = Math.floor(newXp / 500) + 1;
      const gamesPlayed = (user.games_played || 0) + 1;
      const gamesWon = isWinner && !draw ? (user.games_won || 0) + 1 : (user.games_won || 0);

      // Streak victoires
      let currentStreak = user.win_streak || 0;
      let longestStreak = user.longest_win_streak || 0;
      if (isWinner && !draw) {
        currentStreak += 1;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else if (!draw) {
        currentStreak = 0;
      }

      await base44.asServiceRole.entities.User.update ? null : null;
      await base44.auth.updateMe ? null : null;

      // Utiliser l'entité User via SDK service role
      const updateData = {
        xp: newXp,
        gems: newGems,
        level: newLevel,
        games_played: gamesPlayed,
        games_won: gamesWon,
        win_streak: currentStreak,
        longest_win_streak: longestStreak,
      };

      // Update PlayerStats entity
      const stats = await base44.asServiceRole.entities.PlayerStats.filter({ user_id: userId });
      const stat = stats[0];
      const gameWins = gameType === 'chess' ? 'chess_wins' : 'checkers_wins';
      const gameLosses = gameType === 'chess' ? 'chess_losses' : 'checkers_losses';
      const gameDraws = gameType === 'chess' ? 'chess_draws' : 'checkers_draws';

      const statUpdate = {
        user_id: userId,
        username: user.full_name,
        [gameWins]: (stat?.[gameWins] || 0) + (isWinner && !draw ? 1 : 0),
        [gameLosses]: (stat?.[gameLosses] || 0) + (!isWinner && !draw ? 1 : 0),
        [gameDraws]: (stat?.[gameDraws] || 0) + (draw ? 1 : 0),
        ranked_games_count: (stat?.ranked_games_count || 0) + (isRanked ? 1 : 0),
        casual_games_count: (stat?.casual_games_count || 0) + (!isRanked ? 1 : 0),
        current_win_streak: currentStreak,
        longest_win_streak: longestStreak,
        last_updated: new Date().toISOString()
      };

      if (stat?.id) {
        await base44.asServiceRole.entities.PlayerStats.update(stat.id, statUpdate);
      } else {
        await base44.asServiceRole.entities.PlayerStats.create(statUpdate);
      }

      // Badge "Première victoire"
      if (isWinner && !draw && gamesWon === 1) {
        const existing = await base44.asServiceRole.entities.Badge.filter({ user_id: userId, badge_type: 'first_win' });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Badge.create({
            user_id: userId,
            badge_type: 'first_win',
            name: 'Première Victoire',
            earned_at: new Date().toISOString()
          });
        }
      }

      // Badge "Série de 5 victoires"
      if (currentStreak >= 5) {
        const existing = await base44.asServiceRole.entities.Badge.filter({ user_id: userId, badge_type: 'win_streak_5' });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Badge.create({
            user_id: userId,
            badge_type: 'win_streak_5',
            name: 'Série Dorée',
            earned_at: new Date().toISOString()
          });
        }
      }

      return { xpGain, gemsGain, newLevel, newXp, newGems };
    }

    // Traiter les deux joueurs
    const [winnerRewards, loserRewards] = await Promise.all([
      updateUserRewards(winnerId, winnerEmail, true, isDraw),
      updateUserRewards(loserId, loserEmail, false, isDraw)
    ]);

    results.winner = winnerRewards;
    results.loser = loserRewards;

    // Notification avec récompenses
    const notifPayload = (email, isWinner, rewards) => ({
      userEmail: email,
      notificationType: 'game_result',
      title: isDraw ? '🤝 Match nul' : (isWinner ? '🏆 Victoire !' : '😔 Défaite'),
      message: isDraw
        ? `Partie nulle. +${rewards?.xpGain || 0} XP · +${rewards?.gemsGain || 0} 🪙`
        : isWinner
          ? `Vous avez gagné ! +${rewards?.xpGain || 0} XP · +${rewards?.gemsGain || 0} 🪙`
          : `Vous avez perdu. +${rewards?.xpGain || 0} XP · +${rewards?.gemsGain || 0} 🪙`,
      actionLink: roomId ? `GameRoom?roomId=${roomId}` : null
    });

    await Promise.all([
      base44.asServiceRole.functions.invoke('sendNotification', notifPayload(winnerEmail, true, winnerRewards)),
      base44.asServiceRole.functions.invoke('sendNotification', notifPayload(loserEmail, false, loserRewards))
    ]);

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('awardGameRewards error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});