import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albanie' },
  { code: 'DZ', name: 'Algérie' },
  { code: 'AR', name: 'Argentine' },
  { code: 'AU', name: 'Australie' },
  { code: 'AT', name: 'Autriche' },
  { code: 'AZ', name: 'Azerbaïdjan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgique' },
  { code: 'BR', name: 'Brésil' },
  { code: 'BG', name: 'Bulgarie' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chili' },
  { code: 'CN', name: 'Chine' },
  { code: 'CO', name: 'Colombie' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croatie' },
  { code: 'DK', name: 'Danemark' },
  { code: 'EG', name: 'Égypte' },
  { code: 'AE', name: 'Émirats Arabes Unis' },
  { code: 'ES', name: 'Espagne' },
  { code: 'EE', name: 'Estonie' },
  { code: 'US', name: 'États-Unis' },
  { code: 'FI', name: 'Finlande' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Géorgie' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'GR', name: 'Grèce' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hongrie' },
  { code: 'IN', name: 'Inde' },
  { code: 'ID', name: 'Indonésie' },
  { code: 'IR', name: 'Iran' },
  { code: 'IE', name: 'Irlande' },
  { code: 'IS', name: 'Islande' },
  { code: 'IL', name: 'Israël' },
  { code: 'IT', name: 'Italie' },
  { code: 'JP', name: 'Japon' },
  { code: 'JO', name: 'Jordanie' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Koweït' },
  { code: 'LV', name: 'Lettonie' },
  { code: 'LB', name: 'Liban' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lituanie' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MO', name: 'Macao' },
  { code: 'MY', name: 'Malaisie' },
  { code: 'MT', name: 'Malte' },
  { code: 'MA', name: 'Maroc' },
  { code: 'MX', name: 'Mexique' },
  { code: 'MD', name: 'Moldavie' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolie' },
  { code: 'ME', name: 'Monténégro' },
  { code: 'NP', name: 'Népal' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'NZ', name: 'Nouvelle-Zélande' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'NO', name: 'Norvège' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PA', name: 'Panama' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Pérou' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Pologne' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'CZ', name: 'République Tchèque' },
  { code: 'RO', name: 'Roumanie' },
  { code: 'RU', name: 'Russie' },
  { code: 'SA', name: 'Arabie Saoudite' },
  { code: 'SG', name: 'Singapour' },
  { code: 'SK', name: 'Slovaquie' },
  { code: 'SI', name: 'Slovénie' },
  { code: 'SE', name: 'Suède' },
  { code: 'CH', name: 'Suisse' },
  { code: 'SY', name: 'Syrie' },
  { code: 'TW', name: 'Taïwan' },
  { code: 'TH', name: 'Thaïlande' },
  { code: 'TN', name: 'Tunisie' },
  { code: 'TR', name: 'Turquie' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Ouzbékistan' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Viêt Nam' },
  { code: 'YE', name: 'Yémen' },
  { code: 'ZM', name: 'Zambie' },
  { code: 'ZW', name: 'Zimbabwe' }
];

const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '';
  const offset = 127397;
  return String.fromCodePoint(...countryCode.toUpperCase().split('').map(c => c.charCodeAt(0) + offset));
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    country: '',
    date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateAge = (dateStr) => {
    const birthDate = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 18;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        setError('Veuillez entrer votre nom et prénom');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.country) {
        setError('Veuillez sélectionner un pays');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.date_of_birth) {
        setError('Veuillez entrer votre date de naissance');
        return;
      }
      if (!validateAge(formData.date_of_birth)) {
        setError('Vous devez avoir au moins 18 ans');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!formData.username.trim()) {
        setError('Veuillez choisir un pseudo');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await base44.auth.updateMe({
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        country: formData.country,
        date_of_birth: formData.date_of_birth,
        onboarding_completed: true,
        gems: 100,
        level: 1,
        xp: 0
      });
      window.location.href = '/';
    } catch (err) {
      setError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#D4A574]/30 bg-[#2C1810]/80 backdrop-blur-xl p-8 space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-black text-[#F5E6D3] mb-2">DamCash</h1>
            <p className="text-[#D4A574]/60 text-sm">Créez votre profil</p>
            <div className="flex justify-center gap-1 mt-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    s <= step
                      ? 'bg-[#D4A574] w-8'
                      : 'bg-[#D4A574]/20 w-2'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Nom & Prénom */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-[#D4A574] font-semibold mb-2 block">Prénom</label>
                <Input
                  placeholder="Votre prénom"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-white/5 border-[#D4A574]/20 text-[#F5E6D3]"
                />
              </div>
              <div>
                <label className="text-xs text-[#D4A574] font-semibold mb-2 block">Nom</label>
                <Input
                  placeholder="Votre nom"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-white/5 border-[#D4A574]/20 text-[#F5E6D3]"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Pays */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="text-xs text-[#D4A574] font-semibold mb-2 block">Sélectionnez votre pays</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-white/5 border border-[#D4A574]/20 rounded-lg p-3 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]/50"
              >
                <option value="">Choisir un pays...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {getCountryFlag(c.code)} {c.name}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Step 3: Date de naissance */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="text-xs text-[#D4A574] font-semibold mb-2 block">Date de naissance (18+ requis)</label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="bg-white/5 border-[#D4A574]/20 text-[#F5E6D3]"
              />
            </motion.div>
          )}

          {/* Step 4: Pseudo */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-[#D4A574] font-semibold mb-2 block">Votre pseudo (visible publiquement)</label>
                <Input
                  placeholder="Choisissez votre pseudo..."
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.slice(0, 20) })}
                  maxLength="20"
                  className="bg-white/5 border-[#D4A574]/20 text-[#F5E6D3]"
                />
                <p className="text-xs text-[#D4A574]/40 mt-1">{formData.username.length}/20</p>
              </div>
              <div className="bg-[#D4A574]/10 border border-[#D4A574]/20 rounded-lg p-3">
                <p className="text-xs text-[#D4A574]/70">
                  ✓ Vos informations personnelles (nom, prénom, date de naissance) sont protégées et privées.
                </p>
                <p className="text-xs text-[#D4A574]/70 mt-1">
                  ✓ Seul votre pseudo {formData.country && `${getCountryFlag(formData.country)}`} sera visible publiquement.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg p-3"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">{error}</span>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="flex-1 border-[#D4A574]/30 text-[#D4A574]"
              >
                Retour
              </Button>
            )}
            <Button
              onClick={handleNextStep}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] font-bold"
            >
              {step === 4 ? (isLoading ? 'Création...' : 'Créer mon compte') : 'Suivant'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}