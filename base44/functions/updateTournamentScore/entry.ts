import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Mise à jour du score dans un tournoi Arena après une partie terminée
// Points: Victoire = +2, Nul = +1, Défaite = 0
// Bonus streak: 3 victoires consécutives = +4 pts (au lieu de +2)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId, winnerEmail, loserEmail, isDraw } = await req.json();

    if (!tournamentId || !winnerEmail || !loserEmail) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Charger le tournoi
    const tournaments = await base44.asServiceRole.entities.Tournament.filter({ id: tournamentId });
    if (!tournaments.length) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournament = tournaments[0];

    if (tournament.status !== 'in_progress') {
      return Response.json({ error: 'Tournament not in progress' }, { status: 400 });
    }

    // Parser les scores et streaks actuels
    let scores = {};
    let streaks = {};
    try { scores = JSON.parse(tournament.scores || '{}'); } catch { scores = {}; }
    try { streaks = JSON.parse(tournament.streaks || '{}'); } catch { streaks = {}; }

    const isArena = tournament.tournament_type !== 'cup';

    if (isDraw) {
      // Nul: +1 pt pour chacun
      scores[winnerEmail] = (scores[winnerEmail] || 0) + 1;
      scores[loserEmail] = (scores[loserEmail] || 0) + 1;
      streaks[winnerEmail] = 0;
      streaks[loserEmail] = 0;
    } else {
      // Victoire
      const currentStreak = (streaks[winnerEmail] || 0) + 1;
      streaks[winnerEmail] = currentStreak;
      streaks[loserEmail] = 0;

      // Bonus streak pour arenas: 3ème victoire consécutive = +4 pts
      let winnerPoints = isArena ? 2 : 3; // Arena: 2pts, Coupe: 3pts
      if (isArena && currentStreak >= 3) {
        winnerPoints = 4; // Bonus streak
      }
      scores[winnerEmail] = (scores[winnerEmail] || 0) + winnerPoints;
      scores[loserEmail] = scores[loserEmail] || 0; // Défaite = 0 pts
    }

    // Sauvegarder les scores mis à jour
    await base44.asServiceRole.entities.Tournament.update(tournament.id, {
      scores: JSON.stringify(scores),
      streaks: JSON.stringify(streaks)
    });

    // Vérifier si le tournoi est terminé (temps écoulé pour Arena)
    const now = new Date();
    const endDate = tournament.end_date ? new Date(tournament.end_date) : null;
    if (endDate && now >= endDate) {
      // Déterminer le gagnant
      const sortedPlayers = Object.entries(scores).sort(([, a], [, b]) => b - a);
      const winner = sortedPlayers[0]?.[0];

      await base44.asServiceRole.entities.Tournament.update(tournament.id, {
        status: 'finished'
      });

      if (winner) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: winner,
          type: 'tournament_invitation',
          title: '🏆 Vous avez remporté le tournoi !',
          message: `Félicitations ! Vous êtes en tête du "${tournament.name}" avec ${scores[winner]} points.`,
          is_read: false
        });
      }
    }

    return Response.json({
      success: true,
      scores,
      streaks,
      winnerNewScore: isDraw ? scores[winnerEmail] : scores[winnerEmail],
      loserNewScore: scores[loserEmail]
    });
  } catch (error) {
    console.error('updateTournamentScore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});