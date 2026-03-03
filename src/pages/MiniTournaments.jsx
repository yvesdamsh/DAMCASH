import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Lock, Gem, Plus, Clock, Zap, Trophy, Search, Eye } from 'lucide-react';
import CreateMiniTournamentModal from '../components/tournament/CreateMiniTournamentModal';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

const TIME_LABELS = { bullet: '⚡ Bullet', blitz: '🔥 Blitz', rapid: '⏱ Rapide', classic: '♟ Classique' };
const FORMAT_LABELS = { round_robin: '🔄 Round Robin', elimination: '⚔️ Élimination' };

function PlayerSeats({ current, max }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center font-black ${
            i < current
              ? 'bg-[#D4A574] border-[#D4A574] text-[#1a0c06]'
              : 'bg-black/30 border-[#D4A574]/15 text-[#D4A574]/20'
          }`}
        >
          {i < current ? '●' : '○'}
        </motion.div>
      ))}
    </div>
  );
}

function MiniTournamentCard({ room, user, onJoin, onSpectate, onLaunch, idx }) {
  const [pwInput, setPwInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const current = room.players?.length || 0;
  const isFull = current >= room.max_players;
  const isHost = room.host_id === user?.id;
  const isJoined = user && room.players?.includes(user.email);

  const statusColor = room.status === 'in_progress' ? 'text-red-400' : room.status === 'waiting' ? 'text-emerald-400' : 'text-gray-400';
  const statusLabel = room.status === 'in_progress' ? 'EN COURS' : room.status === 'waiting' ? 'EN ATTENTE' : 'TERMINÉ';
  const canAfford = !room.entry_gems || (user?.gems || 0) >= room.entry_gems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="relative rounded-xl border border-[#D4A574]/15 hover:border-[#D4A574]/35 transition-colors overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1a0c06 0%, #241008 50%, #1a0c06 100%)' }}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4A574]/30 to-transparent" />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {room.is_private && <Lock className="w-3 h-3 text-[#D4A574]/50 flex-shrink-0" />}
              <h3 className="font-black text-[#F5E6D3] text-sm truncate">{room.name}</h3>
            </div>
            <p className="text-xs text-[#D4A574]/50">par {room.host_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            <div className={`flex items-center gap-1 text-xs font-black tracking-widest ${statusColor}`}>
              {room.status === 'in_progress' && (
                <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
              {statusLabel}
            </div>
            <span className="text-xs text-[#D4A574]/40">{room.game_type === 'chess' ? '♟' : '⚫'} {room.game_type === 'chess' ? 'Échecs' : 'Dames'}</span>
          </div>
        </div>

        {/* Seats */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#D4A574]/50">{current}/{room.max_players} joueurs</span>
            {!isFull && room.status === 'waiting' && (
              <span className="text-xs text-emerald-400 font-semibold">{room.max_players - current} places</span>
            )}
          </div>
          <PlayerSeats current={current} max={room.max_players} />
        </div>

        {/* Entry fee banner */}
        {room.entry_gems > 0 && (
          <div className={`mb-3 rounded-xl px-3 py-2 flex items-center justify-between border ${
            canAfford
              ? 'bg-[#D4A574]/10 border-[#D4A574]/30'
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <Gem className={`w-4 h-4 ${canAfford ? 'text-[#D4A574]' : 'text-red-400'}`} />
              <span className={`text-sm font-black ${canAfford ? 'text-[#D4A574]' : 'text-red-400'}`}>
                {room.entry_gems} jetons
              </span>
            </div>
            <span className={`text-xs font-semibold ${canAfford ? 'text-[#D4A574]/60' : 'text-red-400/80'}`}>
              {canAfford ? `Vous avez: ${user?.gems || 0}` : '❌ Insuffisant'}
            </span>
          </div>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs bg-black/30 border border-[#D4A574]/10 text-[#D4A574]/60 px-2 py-0.5 rounded-full">
            {TIME_LABELS[room.time_control] || room.time_control}
          </span>
          <span className="text-xs bg-black/30 border border-[#D4A574]/10 text-[#D4A574]/60 px-2 py-0.5 rounded-full">
            {FORMAT_LABELS[room.format] || room.format}
          </span>
        </div>

        {/* Actions */}
        {room.status === 'finished' ? (
          <button className="w-full py-2.5 rounded-xl text-xs font-black text-[#D4A574]/30 border border-[#D4A574]/10 cursor-default">
            TERMINÉ
          </button>
        ) : room.status === 'in_progress' ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSpectate(room)}
            className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 bg-black/30 border border-[#D4A574]/20 text-[#D4A574]/70 hover:border-[#D4A574]/40 hover:text-[#D4A574] transition-all">
            <Eye className="w-3.5 h-3.5" /> REGARDER
          </motion.button>
        ) : isJoined ? (
          <div className="flex gap-2">
            <div className="flex-1 py-2.5 rounded-xl text-xs font-black text-center bg-emerald-900/30 border border-emerald-500/30 text-emerald-400">
              ✓ INSCRIT
            </div>
            {isHost && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => onLaunch(room)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0c06] relative overflow-hidden">
                LANCER
                <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              </motion.button>
            )}
          </div>
        ) : isFull ? (
          <button className="w-full py-2.5 rounded-xl text-xs font-black text-[#D4A574]/30 border border-[#D4A574]/10 cursor-default">
            COMPLET
          </button>
        ) : room.is_private ? (
          <div className="space-y-2">
            {showPw ? (
              <div className="flex gap-2">
                <input value={pwInput} onChange={e => setPwInput(e.target.value)} placeholder="Mot de passe…"
                  className="flex-1 bg-black/30 border border-[#D4A574]/20 rounded-lg px-3 py-1.5 text-xs text-[#F5E6D3] placeholder-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]/50" />
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => onJoin(room, pwInput)}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#D4A574] text-[#1a0c06]">OK</motion.button>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPw(true)}
                className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 bg-[#D4A574]/10 border border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/20 transition-all">
                <Lock className="w-3 h-3" /> ENTRER LE CODE
              </motion.button>
            )}
          </div>
        ) : (
          <motion.button
            whileTap={canAfford ? { scale: 0.97 } : {}}
            onClick={() => canAfford && onJoin(room, null)}
            disabled={!canAfford}
            className={`w-full py-2.5 rounded-xl text-xs font-black transition-all relative overflow-hidden ${
              canAfford
                ? 'bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0c06] hover:shadow-lg hover:shadow-[#D4A574]/20'
                : 'bg-red-900/20 border border-red-500/30 text-red-400/60 cursor-not-allowed'
            }`}>
            {canAfford ? 'REJOINDRE' : `❌ GEMMES INSUFFISANTES`}
            {canAfford && (
              <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default function MiniTournaments() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const urlParams = new URLSearchParams(window.location.search);
  const [gameFilter, setGameFilter] = useState(urlParams.get('game') || 'all');
  const [statusFilter, setStatusFilter] = useState('waiting');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => ok && base44.auth.me().then(setUser).catch(() => {}));
  }, []);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['minitournaments'],
    queryFn: () => base44.entities.MiniTournament.list('-created_date', 50),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const unsub = base44.entities.MiniTournament.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['minitournaments'] });
    });
    return unsub;
  }, [queryClient]);

  const filtered = rooms.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (gameFilter !== 'all' && r.game_type !== gameFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleJoin = async (room, password) => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    if (room.is_private && password !== room.password) { alert('Mot de passe incorrect'); return; }
    if (room.players?.includes(user.email)) return;
    if ((room.players?.length || 0) >= room.max_players) { alert('Ce salon est complet.'); return; }

    // Vérifier les gemmes
    if (room.entry_gems > 0) {
      const userGems = user.gems || 0;
      if (userGems < room.entry_gems) {
        alert(`Gemmes insuffisantes. Il vous faut ${room.entry_gems} gemmes, vous en avez ${userGems}.`);
        return;
      }
      // Déduire les gemmes
      await base44.auth.updateMe({ gems: userGems - room.entry_gems });
      setUser(prev => ({ ...prev, gems: userGems - room.entry_gems }));
    }

    await base44.entities.MiniTournament.update(room.id, {
      players: [...(room.players || []), user.email],
      player_names: [...(room.player_names || []), user.full_name],
    });
  };

  const handleSpectate = (room) => {
    if (!room.room_id) return;
    window.location.href = createPageUrl('GameRoom') + `?roomId=${room.room_id}&spectate=true`;
  };

  const handleLaunch = async (room) => {
    if (!user || room.host_id !== user.id) return;
    if ((room.players?.length || 0) < 2) { toast.error('Il faut au moins 2 joueurs pour lancer.'); return; }
    try {
      // Créer la GameSession pour la première partie
      const roomId = `mini_${room.id}_${Date.now()}`;
      await base44.entities.GameSession.create({
        room_id: roomId,
        player1_id: room.players[0],
        player1_email: room.players[0],
        player1_name: room.player_names?.[0] || 'Joueur 1',
        player2_id: room.players[1],
        player2_email: room.players[1],
        player2_name: room.player_names?.[1] || 'Joueur 2',
        game_type: room.game_type,
        status: 'in_progress',
        current_turn: 'white',
        time_control: room.time_control || 'blitz'
      });
      await base44.entities.MiniTournament.update(room.id, { status: 'in_progress', room_id: roomId });
      // Notifier les joueurs
      await Promise.all(room.players.map(email =>
        base44.entities.Notification?.create?.({
          user_email: email,
          type: 'game_started',
          title: '⚔️ Le tournoi commence !',
          message: `Le salon "${room.name}" a démarré.`,
          link: `GameRoom?roomId=${roomId}`,
          is_read: false
        })
      ));
      queryClient.invalidateQueries({ queryKey: ['minitournaments'] });
      window.location.href = createPageUrl('GameRoom') + `?roomId=${roomId}`;
    } catch (e) {
      toast.error('Erreur lors du lancement');
    }
  };

  const stats = {
    open: rooms.filter(r => r.status === 'waiting').length,
    active: rooms.filter(r => r.status === 'in_progress').length,
    players: rooms.reduce((a, r) => a + (r.players?.length || 0), 0),
  };

  return (
    <div className="min-h-screen text-[#F5E6D3] overflow-x-hidden w-full">
      <CreateMiniTournamentModal open={showCreate} onClose={() => setShowCreate(false)} user={user}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['minitournaments'] })} />

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a0302 0%, #1f0d07 50%, #0a0302 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(#D4A574 1px, transparent 1px), linear-gradient(90deg, #D4A574 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="absolute top-0 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-[0.08]" style={{ background: 'radial-gradient(circle, #D4A574, transparent)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">🃏</span>
                <h1 className="text-2xl md:text-4xl font-black text-[#F5E6D3] tracking-tight">SALONS PRIVÉS</h1>
              </div>
              <p className="text-[#D4A574]/50 text-xs tracking-widest uppercase ml-1">Mini-tournois de 3 à 20 joueurs</p>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { if (!user) { base44.auth.redirectToLogin(); return; } setShowCreate(true); }}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0c06] font-black text-sm hover:shadow-lg hover:shadow-[#D4A574]/25 transition-all whitespace-nowrap">
              <Plus className="w-4 h-4" /> Créer un salon
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Salons ouverts', value: stats.open, color: 'text-emerald-400', icon: '🟢' },
              { label: 'En cours', value: stats.active, color: 'text-red-400', icon: '🔴' },
              { label: 'Joueurs actifs', value: stats.players, color: 'text-[#D4A574]', icon: '👥' },
            ].map(({ label, value, color, icon }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-xl p-4 border border-[#D4A574]/10 bg-black/20">
                <div className="text-lg mb-1">{icon}</div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-[#D4A574]/35 uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0f0604] to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8" style={{ minHeight: '60vh', background: 'linear-gradient(180deg, #0f0604 0%, #1a0c06 100%)' }}>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4A574]/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un salon…"
              className="w-full bg-black/30 border border-[#D4A574]/15 rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5E6D3] placeholder-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]/40" />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-[#D4A574]/10">
            {[{ k: 'waiting', l: 'Ouverts' }, { k: 'in_progress', l: 'En cours' }, { k: 'all', l: 'Tous' }].map(({ k, l }) => (
              <button key={k} onClick={() => setStatusFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === k ? 'bg-[#D4A574] text-[#1a0c06]' : 'text-[#D4A574]/50 hover:text-[#D4A574]'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-[#D4A574]/10">
            {[{ k: 'all', l: 'Tous' }, { k: 'chess', l: '♟' }, { k: 'checkers', l: '⚫' }].map(({ k, l }) => (
              <button key={k} onClick={() => setGameFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${gameFilter === k ? 'bg-[#D4A574] text-[#1a0c06]' : 'text-[#D4A574]/50 hover:text-[#D4A574]'}`}>
                {l}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#D4A574]/25 ml-auto">{filtered.length} salon{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Trophy className="w-8 h-8 text-[#D4A574]" />
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-24 text-center">
            <div className="text-5xl mb-4">🃏</div>
            <p className="text-[#D4A574]/40 font-semibold text-lg mb-1">Aucun salon disponible</p>
            <p className="text-[#D4A574]/20 text-sm mb-6">Soyez le premier à créer un salon !</p>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { if (!user) { base44.auth.redirectToLogin(); return; } setShowCreate(true); }}
              className="px-6 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0c06]">
              Créer le premier salon
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((room, i) => (
                <MiniTournamentCard key={room.id} room={room} user={user} onJoin={handleJoin} onSpectate={handleSpectate} onLaunch={handleLaunch} idx={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}