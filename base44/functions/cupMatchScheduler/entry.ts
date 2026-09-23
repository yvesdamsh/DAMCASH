import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Génère le calendrier des matchs pour une Coupe (format tous contre tous)
// Crée des CupMatch pour chaque paire de participants
// Notifie tous les participants
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId } = await req.json();

    if (!tournamentId) {
      return Response.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    // Charger le tournoi
    const tournaments = await base44.asServiceRole.entities.Tournament.filter({ id: tournamentId });
    if (!tournaments.length) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournament = tournaments[0];

    if (tournament.tournament_type !== 'cup') {
      return Response.json({ error: 'This function is only for cup tournaments' }, { status: 400 });
    }

    if (!tournament.participants || tournament.participants.length < 2) {
      return Response.json({ error: 'Not enough participants (min 2)' }, { status: 400 });
    }

    // Vérifier qu'il n'y a pas déjà des matchs
    const existingMatches = await base44.asServiceRole.entities.CupMatch.filter({ tournament_id: tournamentId });
    if (existingMatches.length > 0) {
      return Response.json({ 
        error: 'Matches already scheduled', 
        count: existingMatches.length 
      }, { status: 400 });
    }

    const participants = tournament.participants;
    const startDate = new Date(tournament.start_date || Date.now());
    const endDate = new Date(tournament.end_date || Date.now() + 30 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(1, Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)));

    // Générer toutes les paires (round-robin)
    const matches = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          player1_email: participants[i],
          player2_email: participants[j]
        });
      }
    }

    // Répartir les matchs sur la durée du tournoi
    const createdMatches = [];
    for (let idx = 0; idx < matches.length; idx++) {
      const match = matches[idx];
      // Espacer les matchs uniformément
      const dayOffset = Math.round((idx / matches.length) * totalDays);
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

      const created = await base44.asServiceRole.entities.CupMatch.create({
        tournament_id: tournamentId,
        player1_email: match.player1_email,
        player2_email: match.player2_email,
        scheduled_date: scheduledDate.toISOString(),
        status: 'scheduled',
        game_type: tournament.game_type,
        time_control: tournament.time_control
      });

      createdMatches.push(created);
    }

    // Marquer le tournoi comme démarré
    await base44.asServiceRole.entities.Tournament.update(tournament.id, {
      status: 'in_progress'
    });

    // Notifier tous les participants
    await Promise.all(participants.map(email =>
      base44.asServiceRole.entities.Notification.create({
        user_email: email,
        type: 'tournament_invitation',
        title: `🛡 Coupe "${tournament.name}" démarrée !`,
        message: `Le calendrier des matchs est disponible. ${matches.length} matchs programmés sur ${totalDays} jours.`,
        is_read: false,
        link: `CupCalendar?id=${tournamentId}`
      })
    ));

    return Response.json({
      success: true,
      matchesCreated: createdMatches.length,
      participants: participants.length,
      tournamentId
    });
  } catch (error) {
    console.error('cupMatchScheduler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});