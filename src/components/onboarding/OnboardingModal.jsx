import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'CD', name: 'Congo (RDC)', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MU', name: 'Maurice', flag: '🇲🇺' },
  { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
  { code: 'HT', name: 'Haïti', flag: '🇭🇹' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'AU', name: 'Australie', flag: '🇦🇺' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'NG', name: 'Nigéria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
];

export function getCountryFlag(code) {
  const c = COUNTRIES.find(c => c.code === code);
  return c ? c.flag : '';
}

export { COUNTRIES };

export default function OnboardingModal({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    pseudo: '',
    birth_date: '',
    country: '',
  });
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateAge = (dateStr) => {
    if (!dateStr) return false;
    const birth = new Date(dateStr);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) return age - 1 >= 18;
    return age >= 18;
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.first_name.trim() || !form.last_name.trim()) { setError('Nom et prénom requis.'); return; }
    if (!form.pseudo.trim()) { setError('Le pseudo est requis.'); return; }
    if (!form.birth_date) { setError('La date de naissance est requise.'); return; }
    if (!validateAge(form.birth_date)) { setError('Vous devez avoir au moins 18 ans pour jouer.'); return; }
    if (!form.country) { setError('Veuillez sélectionner votre pays.'); return; }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        pseudo: form.pseudo.trim(),
        birth_date: form.birth_date,
        country: form.country,
        profile_complete: true,
        gems: user.gems || 100,
        level: user.level || 1,
        xp: user.xp || 0,
        chess_rating: user.chess_rating || 1200,
        checkers_rating: user.checkers_rating || 1200,
        games_played: user.games_played || 0,
        games_won: user.games_won || 0,
      });
      toast.success('Profil complété ! Bienvenue sur DamCash 🎉');
      onComplete();
    } catch (e) {
      setError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[#D4A574]/30 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a0c06, #2C1810)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#D4A574]/15 text-center">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-3">♟️</motion.div>
          <h2 className="text-xl font-black text-[#F5E6D3]">Bienvenue sur DamCash !</h2>
          <p className="text-sm text-[#D4A574]/70 mt-1">Complétez votre profil pour commencer</p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Nom & Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#D4A574]/70 font-semibold uppercase tracking-wider mb-1 block">Prénom *</label>
              <input
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                placeholder="Jean"
                className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-3 py-2.5 text-sm text-[#F5E6D3] placeholder-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]/60"
              />
            </div>
            <div>
              <label className="text-xs text-[#D4A574]/70 font-semibold uppercase tracking-wider mb-1 block">Nom *</label>
              <input
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                placeholder="Dupont"
                className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-3 py-2.5 text-sm text-[#F5E6D3] placeholder-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]/60"
              />
            </div>
          </div>

          {/* Pseudo */}
          <div>
            <label className="text-xs text-[#D4A574]/70 font-semibold uppercase tracking-wider mb-1 block">Pseudo *</label>
            <input
              value={form.pseudo}
              onChange={e => set('pseudo', e.target.value)}
              placeholder="MonPseudo123"
              className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-3 py-2.5 text-sm text-[#F5E6D3] placeholder-[#D4A574]/25 focus:outline-none focus:border-[#D4A574]/60"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="text-xs text-[#D4A574]/70 font-semibold uppercase tracking-wider mb-1 block">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full bg-black/20 border border-[#D4A574]/10 rounded-xl px-3 py-2.5 text-sm text-[#D4A574]/50 cursor-not-allowed"
            />
          </div>

          {/* Date de naissance */}
          <div>
            <label className="text-xs text-[#D4A574]/70 font-semibold uppercase tracking-wider mb-1 block">Date de naissance * (18+ ans)</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-3 py-2.5 text-sm text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]/60"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Pays */}
          <div>
            <label className="text-xs text-[#D4A574]/70 font-semibold uppercase tracking-wider mb-1 block">Pays *</label>
            <select
              value={form.country}
              onChange={e => set('country', e.target.value)}
              className="w-full bg-black/30 border border-[#D4A574]/20 rounded-xl px-3 py-2.5 text-sm text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]/60"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">-- Sélectionnez votre pays --</option>
              {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Age warning */}
          {form.birth_date && !validateAge(form.birth_date) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-300 text-center font-semibold">
              ⛔ Vous devez avoir au moins 18 ans pour jouer sur DamCash.
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-semibold">
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#1a0c06] hover:shadow-lg hover:shadow-[#D4A574]/25 transition-all disabled:opacity-50"
          >
            {loading ? '⏳ Enregistrement...' : '🎮 Commencer à jouer'}
          </motion.button>

          <p className="text-xs text-center text-[#D4A574]/30">En continuant, vous acceptez nos conditions d'utilisation.</p>
        </div>
      </motion.div>
    </div>
  );
}