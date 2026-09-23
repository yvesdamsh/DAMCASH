import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Retourne des statistiques globales pour le dashboard admin
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Charger toutes les données en parallèle
    const [
      allUsers,
      allSessions,
      allTournaments,
      allMiniTournaments,
      allResults,
      allOnlineUsers,
      allNotifications
    ] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 1000),
      base44.asServiceRole.entities.GameSession.list('-created_date', 500),
      base44.asServiceRole.entities.Tournament.list('-created_date', 100),
      base44.asServiceRole.entities.MiniTournament.list('-created_date', 100),
      base44.asServiceRole.entities.GameResult.list('-created_date', 500),
      base44.asServiceRole.entities.OnlineUser.filter({ status: 'online' }),
      base44.asServiceRole.entities.Notification.list('-created_date', 100)
    ]);

    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Calculs
    const totalUsers = allUsers.length;
    const newUsersToday = allUsers.filter(u => new Date(u.created_date) >= last24h).length;
    const newUsersWeek = allUsers.filter(u => new Date(u.created_date) >= last7d).length;
    const onlineNow = allOnlineUsers.filter(u => {
      const lastSeen = new Date(u.last_seen);
      return (now - lastSeen) < 2 * 60 * 1000; // actif dans les 2 dernières minutes
    }).length;

    const totalGames = allSessions.length;
    const gamesInProgress = allSessions.filter(s => s.status === 'in_progress').length;
    const gamesToday = allSessions.filter(s => new Date(s.created_date) >= last24h).length;

    const chessGames = allResults.filter(r => r.game_type === 'chess').length;
    const checkersGames = allResults.filter(r => r.game_type === 'checkers').length;

    const activeTournaments = allTournaments.filter(t => t.status === 'in_progress').length;
    const upcomingTournaments = allTournaments.filter(t => t.status === 'upcoming').length;
    const activeCups = allTournaments.filter(t => t.tournament_type === 'cup' && t.status === 'in_progress').length;

    const activeRooms = allMiniTournaments.filter(m => m.status === 'waiting' || m.status === 'in_progress').length;

    const unreadNotifications = allNotifications.filter(n => !n.is_read).length;

    return Response.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          online: onlineNow,
          newToday: newUsersToday,
          newThisWeek: newUsersWeek
        },
        games: {
          total: totalGames,
          inProgress: gamesInProgress,
          today: gamesToday,
          chess: chessGames,
          checkers: checkersGames
        },
        tournaments: {
          active: activeTournaments,
          upcoming: upcomingTournaments,
          cups: activeCups,
          miniRooms: activeRooms
        },
        notifications: {
          unread: unreadNotifications
        }
      },
      generatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});