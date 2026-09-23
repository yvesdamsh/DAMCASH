import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Matchmaking automatique pour les tournois Arena
// Cherche un participant disponible, crée une GameSession, notifie les 2 joueurs
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

    if (tournament.status !== 'in_progress') {
      return Response.json({ error: 'Tournament not in progress', status: tournament.status }, { status: 400 });
    }

    if (!tournament.participants?.includes(user.email)) {
      return Response.json({ error: 'You are not a participant' }, { status: 403 });
    }

    // Chercher des joueurs en attente de match (dans la file d'attente)
    // On utilise GameSession comme file: sessions "waiting" liées à ce tournoi
    const waitingSessions = await base44.asServiceRole.entities.GameSession.filter({
      status: 'waiting',
      time_control: `tournament:${tournamentId}`
    });

    // Filtrer: ne pas matcher avec soi-même
    const opponentSession = waitingSessions.find(s => s.player1_email !== user.email);

    if (opponentSession) {
      // On a trouvé un adversaire — créer la vraie session de jeu
      const roomId = `arena_${tournamentId}_${Date.now()}`;
      const isWhite = Math.random() > 0.5;

      const player1Email = isWhite ? user.email : opponentSession.player1_email;
      const player1Id = isWhite ? user.id : opponentSession.player1_id;
      const player1Name = isWhite ? user.full_name : opponentSession.player1_name;
      const player2Email = isWhite ? opponentSession.player1_email : user.email;
      const player2Id = isWhite ? opponentSession.player1_id : user.id;
      const player2Name = isWhite ? opponentSession.player1_name : user.full_name;

      // Temps selon time_control
      const timeMap = { bullet: 60, blitz: 180, rapid: 600, classic: 900 };
      const seconds = timeMap[tournament.time_control] || 300;

      // Créer la session de jeu réelle
      const session = await base44.asServiceRole.entities.GameSession.create({
        room_id: roomId,
        player1_id: player1Id,
        player1_email: player1Email,
        player1_name: player1Name,
        player2_id: player2Id,
        player2_email: player2Email,
        player2_name: player2Name,
        game_type: tournament.game_type,
        status: 'in_progress',
        current_turn: 'white',
        white_time: seconds,
        black_time: seconds,
        time_control: tournament.time_control,
        last_move_timestamp: new Date().toISOString()
      });

      // Supprimer la session d'attente de l'adversaire
      await base44.asServiceRole.entities.GameSession.update(opponentSession.id, {
        status: 'finished',
        winner: 'matched'
      });

      // Notifier les deux joueurs
      await Promise.all([
        base44.asServiceRole.entities.Notification.create({
          user_email: player1Email,
          type: 'game_started',
          title: '⚔️ Votre match Arena commence !',
          message: `Vous affrontez ${player2Name} — Cadence ${tournament.time_control}`,
          is_read: false,
          link: `GameRoom?roomId=${roomId}`
        }),
        base44.asServiceRole.entities.Notification.create({
          user_email: player2Email,
          type: 'game_started',
          title: '⚔️ Votre match Arena commence !',
          message: `Vous affrontez ${player1Name} — Cadence ${tournament.time_control}`,
          is_read: false,
          link: `GameRoom?roomId=${roomId}`
        })
      ]);

      return Response.json({
        matched: true,
        roomId,
        opponent: isWhite ? player2Name : player1Name,
        yourColor: isWhite ? 'white' : 'black',
        gameUrl: `GameRoom?roomId=${roomId}`
      });
    } else {
      // Pas d'adversaire dispo — rejoindre la file d'attente
      // Vérifier si déjà en attente
      const alreadyWaiting = waitingSessions.find(s => s.player1_email === user.email);

      if (alreadyWaiting) {
        return Response.json({
          matched: false,
          waiting: true,
          message: 'Déjà en file d\'attente, en attente d\'un adversaire...',
          waitingSessionId: alreadyWaiting.id
        });
      }

      // Créer une session d'attente
      const waitingSession = await base44.asServiceRole.entities.GameSession.create({
        room_id: `waiting_${user.id}_${Date.now()}`,
        player1_id: user.id,
        player1_email: user.email,
        player1_name: user.full_name,
        game_type: tournament.game_type,
        status: 'waiting',
        time_control: `tournament:${tournamentId}` // marquer comme lié au tournoi
      });

      return Response.json({
        matched: false,
        waiting: true,
        message: 'En file d\'attente... Un adversaire vous sera assigné dans les prochaines secondes.',
        waitingSessionId: waitingSession.id
      });
    }
  } catch (error) {
    console.error('arenaMatchmaking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});