import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Gem, Lock, Zap, Clock, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TIME_OPTIONS = [
  { value: 'bullet', label: '⚡ Bullet', desc: '1 min' },
  { value: 'blitz', label: '🔥 Blitz', desc: '3-5 min' },
  { value: 'rapid', label: '⏱ Rapide', desc: '10 min' },
  { value: 'classic', label: '♟ Classique', desc: '30 min' },
];

const PLAYER_COUNTS = [3, 4, 5, 6, 8, 10, 12, 16, 20];

export default function CreateMiniTournamentModal({ open, onClose, user, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    game_type: 'chess',
    max_players: 4,
    time_control: 'blitz',
    format: 'round_robin',
    is_private: false,
    password: '',
    entry_gems: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim() || !user) return;
    setLoading(true);
    await base44.entities.MiniTournament.create({
      ...form,
      host_id: user.id,
      host_name: user.full_name,
      players: [user.email],
      player_names: [user.full_name],
      status: 'waiting',
    });
    setLoading(false);
    onCreated();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden z-10"
            style={{ background: 'linear-gradient(160deg, #1a0c06 0%, #2C1810 100%)', border: '1px solid rgba(212,165,116,0.25)' }}
          >
            {/* Header shimmer */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4A574]/60 to-transparent" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#F5E6D3]">Créer un salon privé</h2>
                  <p className="text-xs text-[#D4A574]/50 mt-0.5">Mini-tournoi de 3 à 20 joueurs</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-[#D4A574]/50 hover:text-[#D4A574] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Nom */}
                <div>
                  <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block">Nom du salon</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Salon de Jean, Partie entre amis…"
                    className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-4 py-2.5 text-sm text-[#F5E6D3] placeholder-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]/50"
                  />
                </div>

                {/* Jeu */}
                <div>
                  <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block">Discipline</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'chess', l: '♟ Échecs' }, { v: 'checkers', l: '⚫ Dames' }].map(({ v, l }) => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, game_type: v }))}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${form.game_type === v ? 'bg-[#D4A574] text-[#1a0c06] border-[#D4A574]' : 'bg-black/20 text-[#D4A574]/60 border-[#D4A574]/15 hover:border-[#D4A574]/35'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre de joueurs */}
                <div>
                  <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                    <Users className="w-3 h-3" /> Taille du salon — {form.max_players} joueurs
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLAYER_COUNTS.map(n => (
                      <button key={n} onClick={() => setForm(f => ({ ...f, max_players: n }))}
                        className={`w-10 h-10 rounded-lg text-sm font-black transition-all border ${form.max_players === n ? 'bg-[#D4A574] text-[#1a0c06] border-[#D4A574]' : 'bg-black/20 text-[#D4A574]/60 border-[#D4A574]/15 hover:border-[#D4A574]/35'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temps */}
                <div>
                  <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block">Cadence</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_OPTIONS.map(({ value, label, desc }) => (
                      <button key={value} onClick={() => setForm(f => ({ ...f, time_control: value }))}
                        className={`py-2 px-3 rounded-xl text-left transition-all border ${form.time_control === value ? 'bg-[#D4A574]/20 border-[#D4A574]/60' : 'bg-black/20 border-[#D4A574]/10 hover:border-[#D4A574]/30'}`}>
                        <div className="text-sm font-bold text-[#F5E6D3]">{label}</div>
                        <div className="text-xs text-[#D4A574]/40">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'round_robin', l: '🔄 Round Robin', d: 'Tout le monde joue' }, { v: 'elimination', l: '⚔️ Élimination', d: 'Perdant éliminé' }].map(({ v, l, d }) => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, format: v }))}
                        className={`py-2 px-3 rounded-xl text-left transition-all border ${form.format === v ? 'bg-[#D4A574]/20 border-[#D4A574]/60' : 'bg-black/20 border-[#D4A574]/10 hover:border-[#D4A574]/30'}`}>
                        <div className="text-sm font-bold text-[#F5E6D3]">{l}</div>
                        <div className="text-xs text-[#D4A574]/40">{d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mise & Privé */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block flex items-center gap-1">
                      <Gem className="w-3 h-3" /> Mise
                    </label>
                    <input
                      type="number" min="0" max="500"
                      value={form.entry_gems}
                      onChange={e => setForm(f => ({ ...f, entry_gems: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-3 py-2.5 text-sm text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Privé
                    </label>
                    <button onClick={() => setForm(f => ({ ...f, is_private: !f.is_private }))}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all border ${form.is_private ? 'bg-[#D4A574]/20 border-[#D4A574]/60 text-[#D4A574]' : 'bg-black/20 border-[#D4A574]/15 text-[#D4A574]/40'}`}>
                      {form.is_private ? '🔒 Oui' : '🔓 Non'}
                    </button>
                  </div>
                </div>

                {form.is_private && (
                  <div>
                    <label className="text-xs text-[#D4A574] font-bold uppercase tracking-widest mb-2 block">Mot de passe</label>
                    <input
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Code d'accès…"
                      className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-4 py-2.5 text-sm text-[#F5E6D3] placeholder-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]/50"
                    />
                  </div>
                )}

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={!form.name.trim() || loading}
                  className="w-full py-3.5 rounded-xl font-black text-sm tracking-widest bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0c06] hover:shadow-lg hover:shadow-[#D4A574]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all relative overflow-hidden"
                >
                  {loading ? 'Création…' : '🃏 Ouvrir le salon'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}