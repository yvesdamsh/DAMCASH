import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trophy, Users, Clock, Gem, Flame, Plus, Zap, Activity, Shield, Crown, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import CreateTournamentModal from '../components/tournament/CreateTournamentModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const STATUS_CONFIG = {
  in_progress: { label: 'EN COURS', dot: 'bg-red-400', text: 'text-red-400' },
  upcoming: { label: 'À VENIR', dot: 'bg-blue-400', text: 'text-blue-400' },
  finished: { label: 'TERMINÉ', dot: 'bg-gray-400', text: 'text-gray-400' },
};

const TIME_LABELS = { bullet: '⚡ Bullet', blitz: '🔥 Blitz', rapid: '⏱ Rapide', classic: '♟ Classique' };

const ARENA_CONFIG = {
  arena_daily:   { label: 'Arena Daily',   icon: '⚡', color: 'from-orange-900 to-red-900',    border: 'border-orange-500/30', duration: '1h',  badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  arena_weekly:  { label: 'Arena Weekly',  icon: '🔥', color: 'from-purple-900 to-indigo-900', border: 'border-purple-500/30', duration: '2h',  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  arena_monthly: { label: 'Arena Monthly', icon: '👑', color: 'from-yellow-900 to-amber-900',  border: 'border-yellow-500/30', duration: '4h',  badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  arena_annual:  { label: 'Arena Annual',  icon: '🏆', color: 'from-rose-900 to-pink-900',     border: 'border-rose-500/30',   duration: '5h',  badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  cup:           { label: 'Coupe',         icon: '🛡', color: 'from-blue-900 to-cyan-900',     border: 'border-blue-500/30',   duration: '30j', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
};

function Countdown({ targetDate }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTime('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return <span className="font-mono font-black text-red-400 tracking-widest">{time}</span>;
}

function PointsRules({ isArena }) {
  if (!isArena) return (
    <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 text-xs space-y-1.5">
      <p className="font-bold text-blue-300">🛡 Format Coupe (League)</p>
      <p className="text-blue-200/60">Tous contre tous — max 30 joueurs — 30 jours</p>
      <div className="flex gap-2 mt-1">
        <div className="flex-1 bg-black/20 rounded p-1.5 text-center">
          <div className="text-green-400 font-black">+3 pts</div>
          <div className="text-[#D4A574]/50">Victoire</div>
        </div>
        <div className="flex-1 bg-black/20 rounded p-1.5 text-center">
          <div className="text-yellow-400 font-black">+1 pt</div>
          <div className="text-[#D4A574]/50">Nul</div>
        </div>
        <div className="flex-1 bg-black/20 rounded p-1.5 text-center">
          <div className="text-red-400 font-black">0 pt</div>
          <div className="text-[#D4A574]/50">Défaite</div>
        </div>
      </div>
      <p className="text-orange-300/70 text-xs">⚠️ Absent 30mn après notif = défaite forfait</p>
    </div>
  );
  return (
    <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3 text-xs space-y-1.5">
      <p className="font-bold text-orange-300">⚡ Système de points Arena</p>
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div className="bg-black/20 rounded p-1.5 text-center">
          <div className="text-green-400 font-black">+2 pts</div>
          <div className="text-[#D4A574]/50">Victoire</div>
        </div>
        <div className="bg-black/20 rounded p-1.5 text-center">
          <div className="text-yellow-400 font-black">+1 pt</div>
          <div className="text-[#D4A574]/50">Nul</div>
        </div>
        <div className="bg-black/20 rounded p-1.5 text-center">
          <div className="text-red-400 font-black">0 pt</div>
          <div className="text-[#D4A574]/50">Défaite</div>
        </div>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
        <p className="text-orange-300 font-bold">🔥 Bonus Streak (3ème victoire d'affilée)</p>
        <p className="text-orange-200/70">= <span className="font-black text-orange-300">+4 pts</span> (nul = +2 pts)</p>
      </div>
      <p className="text-[#D4A574]/40 italic">Random pairing · durée limitée</p>
    </div>
  );
}

function TournamentCard({ tournament, onJoin, idx }) {
  const progress = Math.round(((tournament.participants?.length || 0) / (tournament.max_participants || 1)) * 100);
  const status = STATUS_CONFIG[tournament.status] || STATUS_CONFIG.upcoming;
  const spotsLeft = (tournament.max_participants || 0) - (tournament.participants?.length || 0);
  const cfg = ARENA_CONFIG[tournament.tournament_type || 'cup'];
  const isArena = tournament.tournament_type !== 'cup';
  const isCup = tournament.tournament_type === 'cup';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative group rounded-xl overflow-hidden border ${cfg.border} hover:brightness-110 transition-all`}
      style={{ background: 'linear-gradient(160deg, #1e0e06 0%, #2C1810 50%, #1a0c06 100%)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A574]/40 to-transparent" />

      {/* Banner */}
      <div className="relative h-28 overflow-hidden">
        {tournament.image_url ? (
          <img src={tournament.image_url} alt={tournament.name} className="w-full h-full object-cover opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cfg.color} opacity-60`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e0e06] via-[#1e0e06]/60 to-transparent" />

        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
          {tournament.status === 'in_progress' && (
            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          )}
          <span className={`text-xs font-black tracking-widest ${status.text}`}>{status.label}</span>
        </div>

        <div className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-black ${cfg.badge}`}>
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
          <span className="opacity-70">· {cfg.duration}</span>
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-base font-black text-[#F5E6D3] leading-tight mb-1">{tournament.name}</h3>
          <div className="flex items-center gap-2 text-xs text-[#D4A574]/70">
            <span>{tournament.game_type === 'chess' ? '♟ Échecs' : '⚫ Dames'}</span>
            <span>•</span>
            <span>{TIME_LABELS[tournament.time_control] || tournament.time_control}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#D4A574]/60">
            <Clock className="w-3.5 h-3.5" />
            {tournament.status === 'in_progress' ? (
              <span className="text-red-400 font-semibold">En direct</span>
            ) : tournament.status === 'upcoming' && tournament.start_date ? (
              <span>Début: {format(new Date(tournament.start_date), 'dd MMM · HH:mm', { locale: fr })}</span>
            ) : (
              <span>Terminé</span>
            )}
          </div>
          {tournament.status === 'upcoming' && tournament.start_date && (
            <div className="flex items-center gap-1 text-[#D4A574]/60">
              <Activity className="w-3 h-3" />
              <Countdown targetDate={tournament.start_date} />
            </div>
          )}
        </div>

        {/* Cup: max 30 players info */}
        {isCup && (
          <div className="flex items-center gap-2 text-xs bg-blue-900/20 border border-blue-500/20 rounded-lg px-3 py-2">
            <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-blue-300">Max <span className="font-black">30 joueurs</span> · Tous s'affrontent sur 30 jours</span>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#D4A574]/70">
              <Users className="w-3.5 h-3.5" />
              <span><span className="text-[#F5E6D3] font-bold">{tournament.participants?.length || 0}</span> / {tournament.max_participants}</span>
            </div>
            {spotsLeft > 0 && tournament.status === 'upcoming' && (
              <span className="text-xs text-emerald-400 font-semibold">{spotsLeft} places</span>
            )}
          </div>
          <div className="h-1.5 bg-[#1a0f0f] rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
          </div>
        </div>

        <PointsRules isArena={isArena} />

        {/* Prize + Rewards */}
        <div className="rounded-lg border border-[#D4A574]/20 bg-black/20 p-3 space-y-2">
          <p className="text-xs font-bold text-[#D4A574]/60 uppercase tracking-wider">Récompenses</p>
          <div className="grid grid-cols-3 gap-1 text-xs text-center">
            <div className="bg-yellow-900/30 border border-yellow-500/20 rounded p-1.5">
              <div className="text-yellow-400 font-black">🥇 1er</div>
              <div className="text-white font-bold">{Math.round((tournament.prize_gems || 0) * 0.6)} 🪙</div>
              <div className="text-yellow-300/60">+{isArena ? 200 : 300} XP</div>
            </div>
            <div className="bg-gray-800/30 border border-gray-500/20 rounded p-1.5">
              <div className="text-gray-300 font-black">🥈 2e</div>
              <div className="text-white font-bold">{Math.round((tournament.prize_gems || 0) * 0.3)} 🪙</div>
              <div className="text-gray-300/60">+{isArena ? 100 : 150} XP</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-700/20 rounded p-1.5">
              <div className="text-amber-600 font-black">🥉 3e</div>
              <div className="text-white font-bold">{Math.round((tournament.prize_gems || 0) * 0.1)} 🪙</div>
              <div className="text-amber-600/60">+{isArena ? 50 : 75} XP</div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#D4A574]/10">
            <span className="text-[10px] text-[#D4A574]/40">🎫 Participation: +25 XP</span>
            <span className="text-[10px] text-[#D4A574]/40">🏅 Badge exclusif pour le vainqueur</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onJoin(tournament.id)}
            className={`flex-1 py-2.5 rounded-xl font-black text-sm tracking-widest relative overflow-hidden transition-all ${
              tournament.status === 'finished'
                ? 'bg-[#2C1810] text-[#D4A574]/50 border border-[#D4A574]/20 cursor-default'
                : 'bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0f0f] hover:shadow-lg hover:shadow-[#D4A574]/25'
            }`}
          >
            {tournament.status === 'upcoming' ? "S'INSCRIRE" : tournament.status === 'in_progress' ? 'REJOINDRE' : 'RÉSULTATS'}
            {tournament.status !== 'finished' && (
              <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            )}
          </motion.button>

          {isCup && tournament.status !== 'upcoming' && (
            <Link to={`${createPageUrl('CupCalendar')}?id=${tournament.id}`}>
              <motion.button whileTap={{ scale: 0.97 }}
                className="px-3 py-2.5 rounded-xl font-black text-xs border border-blue-500/30 text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 transition-all flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Calendrier
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Tournaments() {
  const [user, setUser] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('chess');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const g = urlParams.get('game');
    if (g) setGameFilter(g);
    else setGameFilter('chess');
    base44.auth.isAuthenticated().then(ok => ok && base44.auth.me().then(setUser).catch(() => {}));
  }, []);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list('-start_date'),
    refetchInterval: 30000
  });

  useEffect(() => {
    const unsubscribe = base44.entities.Tournament?.subscribe?.(() => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [queryClient]);

  const sampleTournaments = [
    { id: '1', name: 'DamCash Arena Daily', tournament_type: 'arena_daily', game_type: 'chess', status: 'in_progress', start_date: new Date().toISOString(), max_participants: 64, participants: Array(22).fill('u'), prize_gems: 200, time_control: 'blitz', image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800' },
    { id: '2', name: 'DamCash Arena Weekly', tournament_type: 'arena_weekly', game_type: 'chess', status: 'upcoming', start_date: new Date(Date.now() + 86400000).toISOString(), max_participants: 128, participants: Array(45).fill('u'), prize_gems: 500, time_control: 'blitz' },
    { id: '3', name: 'DamCash Arena Monthly', tournament_type: 'arena_monthly', game_type: 'checkers', status: 'upcoming', start_date: new Date(Date.now() + 86400000 * 5).toISOString(), max_participants: 256, participants: Array(89).fill('u'), prize_gems: 2000, time_control: 'rapid' },
    { id: '4', name: 'DamCash Arena Annual 2026', tournament_type: 'arena_annual', game_type: 'chess', status: 'upcoming', start_date: new Date(Date.now() + 86400000 * 30).toISOString(), max_participants: 512, participants: Array(102).fill('u'), prize_gems: 10000, time_control: 'rapid' },
    { id: '5', name: 'Coupe des Dames Mars 2026', tournament_type: 'cup', game_type: 'checkers', status: 'in_progress', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 86400000 * 28).toISOString(), max_participants: 30, participants: Array(24).fill('u'), prize_gems: 500, time_control: 'rapid', image_url: 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=800' },
    { id: '6', name: 'Coupe Échecs Avril 2026', tournament_type: 'cup', game_type: 'chess', status: 'upcoming', start_date: new Date(Date.now() + 86400000 * 7).toISOString(), end_date: new Date(Date.now() + 86400000 * 37).toISOString(), max_participants: 30, participants: Array(8).fill('u'), prize_gems: 500, time_control: 'classic' },
  ];

  const displayTournaments = tournaments.length > 0 ? tournaments : sampleTournaments;

  const filtered = displayTournaments.filter(t => {
    if (typeFilter === 'arena' && t.tournament_type === 'cup') return false;
    if (typeFilter === 'cup' && t.tournament_type !== 'cup') return false;
    if (gameFilter !== 'all' && t.game_type !== gameFilter) return false;
    return true;
  });

  const stats = {
    arenas: displayTournaments.filter(t => t.tournament_type !== 'cup').length,
    cups: displayTournaments.filter(t => t.tournament_type === 'cup').length,
    players: displayTournaments.reduce((a, t) => a + (t.participants?.length || 0), 0),
  };

  const handleJoin = async (id) => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    const tournament = displayTournaments.find(t => t.id === id);
    if (!tournament || tournament.status === 'finished') return;
    if (tournament.participants?.includes(user.email)) { toast('Vous êtes déjà inscrit'); return; }
    const maxPlayers = tournament.tournament_type === 'cup' ? 30 : (tournament.max_participants || 999);
    if ((tournament.participants?.length || 0) >= maxPlayers) { toast('Tournoi complet'); return; }
    try {
      await base44.entities.Tournament.update(id, {
        participants: [...(tournament.participants || []), user.email]
      });
      await base44.entities.Notification?.create?.({
        user_email: user.email,
        type: 'tournament_invitation',
        title: `🏆 Inscription confirmée`,
        message: `Vous êtes inscrit à "${tournament.name}"`,
        is_read: false
      });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success(`Inscrit à ${tournament.name} !`);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen text-[#F5E6D3]">
      <CreateTournamentModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tournaments'] })} user={user} />

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0d0503 0%, #2C1810 50%, #1a0b05 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#D4A574 1px, transparent 1px), linear-gradient(90deg, #D4A574 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #D4A574, transparent)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-14">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-[#D4A574]" />
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#F5E6D3]">COMPÉTITIONS</h1>
              </div>
              <p className="text-[#D4A574]/60 text-sm tracking-widest uppercase pl-11">Arenas DamCash & Coupes</p>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A574]/10 border border-[#D4A574]/30 hover:bg-[#D4A574]/20 text-[#D4A574] font-bold text-sm transition-all">
              <Plus className="w-4 h-4" /> Créer
            </motion.button>
          </motion.div>

          {/* Two-column explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="rounded-xl p-4 border border-orange-500/25 bg-orange-900/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h3 className="font-black text-orange-300">Arenas DamCash</h3>
              </div>
              <p className="text-xs text-orange-200/60 mb-3">Random pairing · Points accumulés · Bonus streak</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/20 rounded p-2"><span className="text-orange-300 font-bold">⚡ Daily</span><p className="text-[#D4A574]/50">1 heure</p></div>
                <div className="bg-black/20 rounded p-2"><span className="text-purple-300 font-bold">🔥 Weekly</span><p className="text-[#D4A574]/50">2 heures</p></div>
                <div className="bg-black/20 rounded p-2"><span className="text-yellow-300 font-bold">👑 Monthly</span><p className="text-[#D4A574]/50">4 heures</p></div>
                <div className="bg-black/20 rounded p-2"><span className="text-rose-300 font-bold">🏆 Annual</span><p className="text-[#D4A574]/50">5 heures</p></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="rounded-xl p-4 border border-blue-500/25 bg-blue-900/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🛡</span>
                <h3 className="font-black text-blue-300">Coupes (League)</h3>
              </div>
              <p className="text-xs text-blue-200/60 mb-2">Tous contre tous · Max 30 joueurs · 30 jours</p>
              <div className="space-y-1 text-xs text-blue-200/50">
                <p>📅 Calendrier des matchs consultable à tout moment</p>
                <p>🔔 Notification 30mn avant chaque match</p>
                <p>⚠️ Absent = défaite forfait automatique</p>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Zap, label: 'Arenas', value: stats.arenas, color: 'text-orange-400' },
              { icon: Shield, label: 'Coupes', value: stats.cups, color: 'text-blue-400' },
              { icon: Users, label: 'Joueurs', value: stats.players.toLocaleString(), color: 'text-[#D4A574]' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-xl p-4 border border-[#D4A574]/15 bg-black/20 backdrop-blur-sm">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-[#D4A574]/40 uppercase tracking-wider mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1a0c06] to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8" style={{ background: 'linear-gradient(180deg, #1a0c06 0%, #2C1810 100%)', minHeight: '60vh' }}>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-[#D4A574]/10">
            {[{ key: 'all', label: 'Tout' }, { key: 'arena', label: '⚡ Arenas' }, { key: 'cup', label: '🛡 Coupes' }].map(f => (
              <button key={f.key} onClick={() => setTypeFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${typeFilter === f.key ? 'bg-[#D4A574] text-[#2C1810]' : 'text-[#D4A574]/60 hover:text-[#D4A574]'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-[#D4A574]/10">
            {[{ key: 'chess', label: '♟ Échecs' }, { key: 'checkers', label: '⚫ Dames' }].map(f => (
              <button key={f.key} onClick={() => setGameFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${gameFilter === f.key ? 'bg-[#D4A574] text-[#2C1810]' : 'text-[#D4A574]/60 hover:text-[#D4A574]'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#D4A574]/30 ml-auto">{filtered.length} compétition{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Trophy className="w-10 h-10 text-[#D4A574]" />
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Trophy className="w-14 h-14 text-[#D4A574]/20 mb-4" />
            <p className="text-[#D4A574]/40 text-lg font-semibold">Aucune compétition trouvée</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((t, i) => (
                <TournamentCard key={t.id} tournament={t} onJoin={handleJoin} idx={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}