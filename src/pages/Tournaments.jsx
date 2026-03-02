import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, Users, Clock, Calendar, Gem, Flame, ChevronRight, Plus, Zap, Shield, Crown, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import CreateTournamentModal from '../components/tournament/CreateTournamentModal';

const STATUS_CONFIG = {
  in_progress: { label: 'EN COURS', color: 'bg-red-600', dot: 'bg-red-400', text: 'text-red-400' },
  upcoming: { label: 'À VENIR', color: 'bg-blue-600', dot: 'bg-blue-400', text: 'text-blue-400' },
  finished: { label: 'TERMINÉ', color: 'bg-gray-600', dot: 'bg-gray-400', text: 'text-gray-400' },
};

const TIME_LABELS = { bullet: '⚡ Bullet', blitz: '🔥 Blitz', rapid: '⏱ Rapide', classic: '♟ Classique' };

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

function TournamentCard({ tournament, onJoin, idx }) {
  const progress = Math.round(((tournament.participants?.length || 0) / (tournament.max_participants || 1)) * 100);
  const status = STATUS_CONFIG[tournament.status] || STATUS_CONFIG.upcoming;
  const spotsLeft = (tournament.max_participants || 0) - (tournament.participants?.length || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group rounded-xl overflow-hidden border border-[#D4A574]/15 hover:border-[#D4A574]/40 transition-colors"
      style={{ background: 'linear-gradient(160deg, #1e0e06 0%, #2C1810 50%, #1a0c06 100%)' }}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A574]/40 to-transparent" />

      {/* Banner image */}
      <div className="relative h-36 overflow-hidden">
        {tournament.image_url ? (
          <img src={tournament.image_url} alt={tournament.name} className="w-full h-full object-cover opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500" />
        ) : (
          <div className={`w-full h-full ${tournament.game_type === 'chess' ? 'bg-gradient-to-br from-purple-900/60 to-indigo-900/60' : 'bg-gradient-to-br from-blue-900/60 to-cyan-900/60'}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e0e06] via-[#1e0e06]/60 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
          {tournament.status === 'in_progress' && (
            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          )}
          <span className={`text-xs font-black tracking-widest ${status.text}`}>{status.label}</span>
        </div>

        {/* Prize badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4A574]/20 border border-[#D4A574]/40">
          <Gem className="w-3 h-3 text-[#D4A574]" />
          <span className="text-[#D4A574] text-xs font-black">{tournament.prize_gems?.toLocaleString()}</span>
        </div>

        {/* Title over image */}
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
      <div className="p-4 space-y-4">
        {/* Countdown or date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#D4A574]/60">
            <Clock className="w-3.5 h-3.5" />
            {tournament.status === 'in_progress' ? (
              <span className="text-red-400 font-semibold">En direct</span>
            ) : tournament.status === 'upcoming' ? (
              <span>Début: {format(new Date(tournament.start_date), 'dd MMM · HH:mm', { locale: fr })}</span>
            ) : (
              <span>Terminé</span>
            )}
          </div>
          {tournament.status === 'upcoming' && (
            <div className="text-xs text-[#D4A574]/60 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <Countdown targetDate={tournament.start_date} />
            </div>
          )}
        </div>

        {/* Participants progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-[#D4A574]/70">
              <Users className="w-3.5 h-3.5" />
              <span><span className="text-[#F5E6D3] font-bold">{tournament.participants?.length || 0}</span> / {tournament.max_participants} joueurs</span>
            </div>
            {spotsLeft > 0 && tournament.status === 'upcoming' && (
              <span className="text-xs text-emerald-400 font-semibold">{spotsLeft} places libres</span>
            )}
          </div>
          <div className="h-1.5 bg-[#1a0f0f] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Prize breakdown */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { rank: '🥇', pct: 0.6, label: '1er' },
            { rank: '🥈', pct: 0.3, label: '2e' },
            { rank: '🥉', pct: 0.1, label: '3e' },
          ].map(({ rank, pct, label }) => (
            <div key={label} className="bg-black/20 rounded-lg p-2 text-center border border-[#D4A574]/10">
              <div className="text-sm mb-0.5">{rank}</div>
              <div className="text-xs font-black text-[#F5E6D3]">{Math.round((tournament.prize_gems || 0) * pct)}</div>
              <div className="text-xs text-[#D4A574]/40">{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onJoin(tournament.id)}
          className={`w-full py-3 rounded-xl font-black text-sm tracking-widest relative overflow-hidden transition-all ${
            tournament.status === 'finished'
              ? 'bg-[#2C1810] text-[#D4A574]/50 border border-[#D4A574]/20 cursor-default'
              : 'bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0f0f] hover:shadow-lg hover:shadow-[#D4A574]/25'
          }`}
        >
          {tournament.status === 'upcoming' ? "S'INSCRIRE" : tournament.status === 'in_progress' ? 'REJOINDRE' : 'RÉSULTATS'}
          {tournament.status !== 'finished' && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Tournaments() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [gameFilter, setGameFilter] = useState(urlParams.get('game') || 'all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => ok && base44.auth.me().then(setUser).catch(() => {}));
  }, []);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list('-start_date'),
    refetchInterval: 30000
  });

  // Realtime: écouter les changements de tournois
  useEffect(() => {
    const unsubscribe = base44.entities.Tournament?.subscribe?.(() => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [queryClient]);

  const sampleTournaments = [
    { id: '1', name: 'Grand Prix Échecs', game_type: 'chess', status: 'upcoming', start_date: new Date(Date.now() + 86400000 * 2).toISOString(), max_participants: 64, participants: Array(22).fill('u'), prize_gems: 500, time_control: 'blitz', image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800' },
    { id: '2', name: 'Coupe des Dames', game_type: 'checkers', status: 'in_progress', start_date: new Date().toISOString(), max_participants: 32, participants: Array(28).fill('u'), prize_gems: 250, time_control: 'rapid', image_url: 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=800' },
    { id: '3', name: 'Tournoi Bullet Express', game_type: 'chess', status: 'upcoming', start_date: new Date(Date.now() + 86400000 * 5).toISOString(), max_participants: 128, participants: Array(85).fill('u'), prize_gems: 1000, time_control: 'bullet', image_url: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800' },
    { id: '4', name: 'Défi Dames Rapide', game_type: 'checkers', status: 'upcoming', start_date: new Date(Date.now() + 86400000).toISOString(), max_participants: 16, participants: Array(4).fill('u'), prize_gems: 150, time_control: 'blitz', image_url: 'https://images.unsplash.com/photo-1566417713940-c067a354e0be?w=800' },
  ];

  const displayTournaments = tournaments.length > 0 ? tournaments : sampleTournaments;

  const filtered = displayTournaments.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (gameFilter !== 'all' && t.game_type !== gameFilter) return false;
    return true;
  });

  const stats = {
    active: displayTournaments.filter(t => t.status === 'in_progress').length,
    players: displayTournaments.reduce((a, t) => a + (t.participants?.length || 0), 0),
    gems: displayTournaments.reduce((a, t) => a + (t.prize_gems || 0), 0),
  };

  const handleJoin = async (id) => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    const tournament = displayTournaments.find(t => t.id === id);
    if (!tournament) return;
    if (tournament.status === 'finished') return;
    if (tournament.participants?.includes(user.email)) {
      toast?.('Vous êtes déjà inscrit à ce tournoi'); return;
    }
    if ((tournament.participants?.length || 0) >= (tournament.max_participants || 999)) {
      toast?.('Ce tournoi est complet'); return;
    }
    try {
      await base44.entities.Tournament.update(id, {
        participants: [...(tournament.participants || []), user.email]
      });
      await base44.entities.Notification?.create?.({
        user_email: user.email,
        type: 'tournament_invitation',
        title: `🏆 Inscription confirmée`,
        message: `Vous êtes inscrit au tournoi "${tournament.name}"`,
        is_read: false
      });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    } catch (e) {
      console.log('Erreur inscription tournoi:', e);
    }
  };

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'upcoming', label: 'À venir' },
    { key: 'finished', label: 'Terminés' },
  ];

  return (
    <div className="min-h-screen text-[#F5E6D3]">
      <CreateTournamentModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tournaments'] })} user={user} />

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0d0503 0%, #2C1810 50%, #1a0b05 100%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(#D4A574 1px, transparent 1px), linear-gradient(90deg, #D4A574 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #D4A574, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #8B5A2B, transparent)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-14">
          {/* Title row */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <Trophy className="w-8 h-8 text-[#D4A574]" />
                  <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute inset-0 rounded-full bg-[#D4A574]/30" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#F5E6D3]">TOURNOIS</h1>
              </div>
              <p className="text-[#D4A574]/60 text-sm tracking-widest uppercase pl-11">Compétitions officielles & qualifiantes</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A574]/10 border border-[#D4A574]/30 hover:bg-[#D4A574]/20 hover:border-[#D4A574]/60 text-[#D4A574] font-bold text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Créer
            </motion.button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Flame, label: 'Actifs', value: stats.active, color: 'text-red-400' },
              { icon: Users, label: 'Joueurs', value: stats.players.toLocaleString(), color: 'text-blue-400' },
              { icon: Gem, label: 'En jeu', value: stats.gems.toLocaleString(), color: 'text-[#D4A574]' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="rounded-xl p-4 border border-[#D4A574]/15 bg-black/20 backdrop-blur-sm"
              >
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-[#D4A574]/40 uppercase tracking-wider mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1a0c06] to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8" style={{ background: 'linear-gradient(180deg, #1a0c06 0%, #2C1810 100%)', minHeight: '60vh' }}>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Status pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-[#D4A574]/10">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                  statusFilter === f.key
                    ? 'bg-[#D4A574] text-[#2C1810]'
                    : 'text-[#D4A574]/60 hover:text-[#D4A574]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Game type pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-[#D4A574]/10">
            {[{ key: 'all', label: 'Tous' }, { key: 'chess', label: '♟ Échecs' }, { key: 'checkers', label: '⚫ Dames' }].map(f => (
              <button
                key={f.key}
                onClick={() => setGameFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                  gameFilter === f.key
                    ? 'bg-[#D4A574] text-[#2C1810]'
                    : 'text-[#D4A574]/60 hover:text-[#D4A574]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#D4A574]/30 ml-auto">{filtered.length} tournoi{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Trophy className="w-10 h-10 text-[#D4A574]" />
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Trophy className="w-14 h-14 text-[#D4A574]/20 mb-4" />
            <p className="text-[#D4A574]/40 text-lg font-semibold">Aucun tournoi trouvé</p>
            <p className="text-[#D4A574]/20 text-sm mt-1">Modifiez vos filtres</p>
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