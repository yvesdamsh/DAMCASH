import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Automation schedulée: vérifie les matchs de Coupe prévus dans les 30 prochaines minutes
// et envoie des rappels aux joueurs concernés
// À appeler toutes les 15 minutes via une automation schedulée
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);

    // Charger tous les matchs programmés prochainement
    const allMatches = await base44.asServiceRole.entities.CupMatch.filter({ status: 'scheduled' });

    const upcomingMatches = allMatches.filter(match => {
      if (!match.scheduled_date) return false;
      const matchDate = new Date(match.scheduled_date);
      return matchDate >= now && matchDate <= in30min && !match.reminder_sent;
    });

    const notified = [];

    for (const match of upcomingMatches) {
      const matchDate = new Date(match.scheduled_date);
      const minutesLeft = Math.round((matchDate - now) / 60000);

      // Notifier les deux joueurs
      await Promise.all([
        base44.asServiceRole.entities.Notification.create({
          user_email: match.player1_email,
          type: 'tournament_invitation',
          title: '⏰ Match de Coupe dans 30 minutes !',
          message: `Votre match contre ${match.player2_email.split('@')[0]} commence dans ${minutesLeft} minutes. Préparez-vous !`,
          is_read: false,
          link: `Tournaments`
        }),
        base44.asServiceRole.entities.Notification.create({
          user_email: match.player2_email,
          type: 'tournament_invitation',
          title: '⏰ Match de Coupe dans 30 minutes !',
          message: `Votre match contre ${match.player1_email.split('@')[0]} commence dans ${minutesLeft} minutes. Préparez-vous !`,
          is_read: false,
          link: `Tournaments`
        }),
        // Email de rappel
        base44.integrations.Core.SendEmail({
          to: match.player1_email,
          subject: '⏰ DamCash - Votre match commence bientôt !',
          body: `Bonjour,\n\nVotre match de Coupe contre ${match.player2_email.split('@')[0]} commence dans ${minutesLeft} minutes.\n\nConnectez-vous sur DamCash pour jouer !\n\nBonne chance !\nDamCash`
        }).catch(() => {}),
        base44.integrations.Core.SendEmail({
          to: match.player2_email,
          subject: '⏰ DamCash - Votre match commence bientôt !',
          body: `Bonjour,\n\nVotre match de Coupe contre ${match.player1_email.split('@')[0]} commence dans ${minutesLeft} minutes.\n\nConnectez-vous sur DamCash pour jouer !\n\nBonne chance !\nDamCash`
        }).catch(() => {})
      ]);

      // Marquer le rappel comme envoyé
      await base44.asServiceRole.entities.CupMatch.update(match.id, {
        reminder_sent: true
      });

      notified.push({ matchId: match.id, player1: match.player1_email, player2: match.player2_email });
    }

    // Vérifier les matchs passés sans résultat (forfait si > 30min dépassées)
    const pastDeadlineMatches = allMatches.filter(match => {
      if (!match.scheduled_date || match.status !== 'scheduled') return false;
      const matchDate = new Date(match.scheduled_date);
      const deadline = new Date(matchDate.getTime() + 30 * 60 * 1000); // 30min grace
      return deadline < now;
    });

    const forfeited = [];
    for (const match of pastDeadlineMatches) {
      // Les deux joueurs absents = match reporté, sinon forfait
      await base44.asServiceRole.entities.CupMatch.update(match.id, {
        status: 'forfeited',
        result: 'forfeit'
      });

      // Mettre à jour les scores du tournoi (0 pts pour les deux en cas de double forfait)
      // ou gérer selon les règles de la coupe
      await Promise.all([
        base44.asServiceRole.entities.Notification.create({
          user_email: match.player1_email,
          type: 'tournament_invitation',
          title: '⚠️ Match de Coupe annulé',
          message: `Votre match contre ${match.player2_email.split('@')[0]} a été déclaré forfait (absence des deux joueurs).`,
          is_read: false
        }),
        base44.asServiceRole.entities.Notification.create({
          user_email: match.player2_email,
          type: 'tournament_invitation',
          title: '⚠️ Match de Coupe annulé',
          message: `Votre match contre ${match.player1_email.split('@')[0]} a été déclaré forfait (absence des deux joueurs).`,
          is_read: false
        })
      ]);

      forfeited.push(match.id);
    }

    return Response.json({
      success: true,
      reminderseSent: notified.length,
      notified,
      forfeited: forfeited.length
    });
  } catch (error) {
    console.error('notifyCupMatchReminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});