import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const INACTIVITY_THRESHOLD_MINUTES = 5; // Notification après 5 minutes d'inactivité

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { roomId } = await req.json();

    if (!roomId) {
      return Response.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // Charger la session de jeu
    const sessions = await base44.asServiceRole.entities.GameSession.filter({
      room_id: roomId
    });

    if (!sessions.length) {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }

    const session = sessions[0];

    // Vérifier que le jeu est en cours
    if (session.status !== 'in_progress') {
      return Response.json({ message: 'Game not in progress' });
    }

    // Calculer le temps d'inactivité
    const lastMoveTime = session.last_move_timestamp 
      ? new Date(session.last_move_timestamp)
      : new Date(session.created_date);
    
    const now = new Date();
    const inactivityMinutes = (now - lastMoveTime) / (1000 * 60);

    // Si inactivité > seuil, envoyer notification au joueur dont c'est le tour
    if (inactivityMinutes >= INACTIVITY_THRESHOLD_MINUTES) {
      const isPlayer1Turn = session.current_turn === 'white' && session.player1_id;
      const isPlayer2Turn = session.current_turn === 'black' && session.player2_id;

      let playerToNotifyId = null;
      let playerToNotifyEmail = null;
      let opponentName = null;

      if (isPlayer1Turn) {
        playerToNotifyId = session.player1_id;
        playerToNotifyEmail = session.player1_email;
        opponentName = session.player2_name || 'Votre adversaire';
      } else if (isPlayer2Turn) {
        playerToNotifyId = session.player2_id;
        playerToNotifyEmail = session.player2_email;
        opponentName = session.player1_name || 'Votre adversaire';
      }

      if (playerToNotifyEmail) {
        // Créer la notification in-app
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: playerToNotifyEmail,
          notification_type: 'game_turn',
          title: '⏰ À vous de jouer!',
          message: `${opponentName} attend votre coup depuis ${Math.round(inactivityMinutes)} minutes`,
          related_entity_id: roomId,
          related_entity_type: 'game',
          action_link: `GameRoom?roomId=${roomId}`,
          sent_via_push: true,
          delivered: false
        });

        // Envoyer email de rappel
        try {
          await base44.integrations.Core.SendEmail({
            to: playerToNotifyEmail,
            subject: '⏰ DamCash - À vous de jouer!',
            body: `
Bonjour,

Vous avez une partie en cours depuis ${Math.round(inactivityMinutes)} minutes.
${opponentName} attend votre coup!

Rejoignez votre partie: https://damcash.app/GameRoom?roomId=${roomId}

Bonne chance!
DamCash
            `
          });
        } catch (emailError) {
          console.log('Email notification failed:', emailError?.message || emailError);
        }

        return Response.json({
          success: true,
          message: 'Notification envoyée au joueur inactif',
          playerEmail: playerToNotifyEmail,
          inactivityMinutes: Math.round(inactivityMinutes)
        });
      }
    }

    return Response.json({
      message: 'No action needed',
      inactivityMinutes: Math.round(inactivityMinutes),
      threshold: INACTIVITY_THRESHOLD_MINUTES
    });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});