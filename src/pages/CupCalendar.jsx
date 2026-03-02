import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Bell, Trophy, ChevronLeft, AlertCircle, CheckCircle, XCircle, Minus } from 'lucide-react';
import { format, isPast, isFuture, addMinutes, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

const RESULT_CONFIG = {
  player1_win:     { label: 'Victoire', icon: CheckCircle, color: 'text-green-400' },
  player2_win:     { label: 'Victoire', icon: CheckCircle, color: 'text-green-400' },
  draw:            { label: 'Nul', icon: Minus, color: 'text-yellow-400' },
  player1_forfeit: { label: 'Forfait', icon: XCircle, color: 'text-red-400' },
  player2_forfeit: { label: 'Forfait', icon: XCircle, color: 'text-red-400' },
};

function MatchCard({ match, userEmail, idx }) {
  const isPlayer1 = match.player1_email === userEmail;
  const isPlayer2 = match.player2_email === userEmail;
  const isMyMatch = isPlayer1 || isPlayer2;

  const myName = isPlayer1 ? match.player1_name : match.player2_name;
  const opponentName = isPlayer1 ? match.player2_name : match.player1_name;

  const scheduled = new Date(match.scheduled_date);
  const now = new Date();
  const minutesUntil = differenceInMinutes(scheduled, now);
  const isPending = match.status === 'scheduled' && isFuture(scheduled);
  const isSoon = isPending && minutesUntil <= 30 && minutesUntil > 0;
  const isOverdue = match.status === 'scheduled' && isPast(addMinutes(scheduled, 30));

  let myResult = null;
  if (match.result) {
    if (match.result === 'draw') myResult = 'draw';
    else if ((isPlayer1 && match.result === 'player1_win') || (isPlayer2 && match.result === 'player2_win')) myResult = 'win';
    else if ((isPlayer1 && match.result === 'player1_forfeit') || (isPlayer2 && match.result === 'player2_forfeit')) myResult = 'forfeit';
    else myResult = 'loss';
  }

  const resultColors = { win: 'border-green-500/40 bg-green-900/10', loss: 'border-red-500/40 bg-red-900/10', draw: 'border-yellow-500/40 bg-yellow-900/10', forfeit: 'border-red-500/40 bg-red-900/10' };
  const borderClass = isMyMatch && myResult ? resultColors[myResult] : isSoon ? 'border-orange-500/50 bg-orange-900/10' : 'border-[#D4A574]/15 bg-black/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={`rounded-xl border p-3.5 transition-all ${borderClass} ${isMyMatch ? 'ring-1 ring-[#D4A574]/20' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-[#D4A574]/50">
          <Calendar className="w-3 h-3" />
          <span>{format(scheduled, 'dd MMM · HH:mm', { locale: fr })}</span>
          {isSoon && (
            <span className="flex items-center gap-1 text-orange-400 font-bold">
              <Bell className="w-3 h-3" /> dans {minutesUntil}mn
            </span>
          )}
          {isOverdue && match.status === 'scheduled' && (
            <span className="text-red-400/70">En retard</span>
          )}
        </div>
        <span className="text-xs font-bold text-[#D4A574]/30">J{match.round}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 text-right">
          <p className={`text-sm font-black truncate ${isPlayer1 ? 'text-[#D4A574]' : 'text-[#F5E6D3]/70'}`}>{match.player1_name}</p>
        </div>
        <div className="flex-shrink-0">
          {match.status === 'finished' || match.status === 'forfeit' ? (
            <div className="text-center">
              {match.result === 'draw' ? (
                <span className="text-yellow-400 font-black text-sm">½ - ½</span>
              ) : match.result === 'player1_win' ? (
                <span className="font-black text-sm"><span className="text-green-400">1</span> - <span className="text-red-400">0</span></span>
              ) : match.result === 'player2_win' ? (
                <span className="font-black text-sm"><span className="text-red-400">0</span> - <span className="text-green-400">1</span></span>
              ) : match.result === 'player1_forfeit' ? (
                <span className="font-black text-sm"><span className="text-red-400">F</span> - <span className="text-green-400">+</span></span>
              ) : (
                <span className="font-black text-sm"><span className="text-green-400">+</span> - <span className="text-red-400">F</span></span>
              )}
            </div>
          ) : (
            <span className="text-[#D4A574]/40 font-black text-sm px-2">vs</span>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className={`text-sm font-black truncate ${isPlayer2 ? 'text-[#D4A574]' : 'text-[#F5E6D3]/70'}`}>{match.player2_name}</p>
        </div>
      </div>

      {isMyMatch && match.status === 'scheduled' && (
        <div className="mt-2 pt-2 border-t border-[#D4A574]/10">
          {isSoon ? (
            <p className="text-xs text-orange-400 font-semibold text-center">🔔 Votre match commence bientôt !</p>
          ) : isPending ? (
            <p className="text-xs text-[#D4A574]/40 text-center">Vous serez notifié 30mn avant</p>
          ) : (
            <p className="text-xs text-red-400/70 text-center">⚠️ Match expiré — défaite forfait si absent</p>
          )}
        </div>
      )}

      {isMyMatch && myResult && (
        <div className="mt-2 pt-2 border-t border-[#D4A574]/10 text-center">
          <span className={`text-xs font-black ${myResult === 'win' ? 'text-green-400' : myResult === 'draw' ? 'text-yellow-400' : 'text-red-400'}`}>
            {myResult === 'win' ? '✓ Victoire' : myResult === 'draw' ? '½ Nul' : myResult === 'forfeit' ? '❌ Forfait' : '✗ Défaite'}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function Standings({ matches, participants }) {
  // Compute standings from finished matches
  const scores = {};
  for (const p of (participants || [])) {
    scores[p] = { email: p, points: 0, wins: 0, draws: 0, losses: 0, forfeits: 0, played: 0 };
  }

  for (const m of matches) {
    if (m.status !== 'finished' && m.status !== 'forfeit') continue;
    const p1 = scores[m.player1_email] || { email: m.player1_email, points: 0, wins: 0, draws: 0, losses: 0, forfeits: 0, played: 0 };
    const p2 = scores[m.player2_email] || { email: m.player2_email, points: 0, wins: 0, draws: 0, losses: 0, forfeits: 0, played: 0 };

    if (!scores[m.player1_email]) scores[m.player1_email] = p1;
    if (!scores[m.player2_email]) scores[m.player2_email] = p2;

    p1.played++; p2.played++;

    if (m.result === 'player1_win') { p1.points += 3; p1.wins++; p2.losses++; }
    else if (m.result === 'player2_win') { p2.points += 3; p2.wins++; p1.losses++; }
    else if (m.result === 'draw') { p1.points += 1; p2.points += 1; p1.draws++; p2.draws++; }
    else if (m.result === 'player1_forfeit') { p2.points += 3; p2.wins++; p1.forfeits++; }
    else if (m.result === 'player2_forfeit') { p1.points += 3; p1.wins++; p2.forfeits++; }
  }

  const sorted = Object.values(scores).sort((a, b) => b.points - a.points || b.wins - a.wins);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#D4A574]/20 overflow-hidden">
      <div className="bg-[#D4A574]/10 px-4 py-3 border-b border-[#D4A574]/20">
        <h3 className="font-black text-[#D4A574] text-sm">🏆 Classement</h3>
      </div>
      <div className="divide-y divide-[#D4A574]/10">
        {sorted.map((p, i) => (
          <div key={p.email} className={`flex items-center gap-3 px-4 py-2.5 ${i < 3 ? 'bg-[#D4A574]/5' : ''}`}>
            <span className="w-6 text-center font-black text-sm text-[#D4A574]">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </span>
            <span className="flex-1 text-sm text-[#F5E6D3] truncate">{p.email.split('@')[0]}</span>
            <div className="flex items-center gap-3 text-xs text-[#D4A574]/50">
              <span>{p.played}J</span>
              <span className="text-green-400">{p.wins}V</span>
              <span className="text-yellow-400">{p.draws}N</span>
              <span className="text-red-400">{p.losses + p.forfeits}D</span>
            </div>
            <span className="font-black text-[#D4A574] text-sm w-8 text-right">{p.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CupCalendar() {
  const [user, setUser] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => ok && base44.auth.me().then(setUser).catch(() => {}));
    if (tournamentId) {
      base44.entities.Tournament.filter({ id: tournamentId }).then(res => {
        if (res.length > 0) setTournament(res[0]);
      }).catch(() => {});
    }
  }, [tournamentId]);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['cup-matches', tournamentId],
    queryFn: () => base44.entities.CupMatch.filter({ tournament_id: tournamentId }, 'scheduled_date', 200),
    enabled: !!tournamentId,
    refetchInterval: 30000,
  });

  // Group matches by round
  const matchesByRound = matches.reduce((acc, m) => {
    const r = m.round || 1;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  const myMatches = user ? matches.filter(m => m.player1_email === user.email || m.player2_email === user.email) : [];
  const upcomingMyMatches = myMatches.filter(m => m.status === 'scheduled' && isFuture(new Date(m.scheduled_date)));

  const totalRounds = tournament ? (tournament.max_participants || 30) - 1 : 0;
  const completedMatches = matches.filter(m => m.status === 'finished' || m.status === 'forfeit').length;

  return (
    <div className="min-h-screen text-[#F5E6D3]" style={{ background: 'linear-gradient(180deg, #1a0c06 0%, #2C1810 100%)' }}>
      {/* Header */}
      <div className="sticky top-16 z-40 bg-[#1a0c06]/80 backdrop-blur-xl border-b border-[#D4A574]/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link to={createPageUrl('Tournaments')} className="text-[#D4A574]/60 hover:text-[#D4A574] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-[#F5E6D3]">{tournament?.name || 'Calendrier Coupe'}</h1>
              <p className="text-xs text-[#D4A574]/50">
                {tournament?.game_type === 'chess' ? '♟ Échecs' : '⚫ Dames'} · Max 30 joueurs · 30 jours
              </p>
            </div>
          </div>

          {/* My upcoming matches alert */}
          {upcomingMyMatches.length > 0 && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-300">
                <span className="font-black">Votre prochain match :</span> {format(new Date(upcomingMyMatches[0].scheduled_date), 'dd MMM à HH:mm', { locale: fr })} — Notif 30mn avant
              </p>
            </div>
          )}

          {/* Forfeit warning */}
          <div className="bg-red-900/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300/80">Absence 30mn après votre heure de match = <span className="font-black text-red-400">défaite forfait automatique</span></p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 text-xs text-[#D4A574]/50">
            <span>{completedMatches} / {matches.length} matchs joués</span>
            <div className="flex-1 h-1 bg-[#2C1810] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] rounded-full transition-all" style={{ width: matches.length > 0 ? `${(completedMatches / matches.length) * 100}%` : '0%' }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 p-1 bg-black/30 rounded-xl border border-[#D4A574]/10">
            {[{ key: 'calendar', label: '📅 Calendrier' }, { key: 'mine', label: '⚔️ Mes matchs' }, { key: 'standings', label: '🏆 Classement' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-[#D4A574] text-[#2C1810]' : 'text-[#D4A574]/60 hover:text-[#D4A574]'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Calendar className="w-8 h-8 text-[#D4A574]" />
            </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {matches.length === 0 ? (
                  <div className="text-center py-20">
                    <Calendar className="w-12 h-12 text-[#D4A574]/20 mx-auto mb-3" />
                    <p className="text-[#D4A574]/40">Le calendrier sera généré au démarrage de la coupe</p>
                    <p className="text-[#D4A574]/25 text-sm mt-1">Chaque joueur affrontera tous les autres sur 30 jours</p>
                  </div>
                ) : (
                  Object.entries(matchesByRound).map(([round, roundMatches]) => (
                    <div key={round}>
                      <h3 className="text-xs font-black text-[#D4A574]/50 uppercase tracking-widest mb-3">Journée {round}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {roundMatches.map((m, i) => (
                          <MatchCard key={m.id} match={m} userEmail={user?.email} idx={i} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'mine' && (
              <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {!user ? (
                  <p className="text-center text-[#D4A574]/40 py-12">Connectez-vous pour voir vos matchs</p>
                ) : myMatches.length === 0 ? (
                  <p className="text-center text-[#D4A574]/40 py-12">Vous n'êtes pas inscrit à cette coupe</p>
                ) : (
                  myMatches.map((m, i) => (
                    <MatchCard key={m.id} match={m} userEmail={user.email} idx={i} />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'standings' && (
              <motion.div key="standings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Standings matches={matches} participants={tournament?.participants} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}