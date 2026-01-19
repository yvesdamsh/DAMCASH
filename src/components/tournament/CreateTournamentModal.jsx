import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreateTournamentModal({ open, onOpenChange, onSuccess, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    game_type: 'chess',
    time_control: 'blitz',
    difficulty: 'intermediate',
    start_date: '',
    start_time: '19:00',
    end_date: '',
    end_time: '21:00',
    registration_deadline: '',
    max_participants: 32,
    min_participants: 4,
    entry_price: 0,
    prize_1st: 0,
    prize_2nd: 0,
    prize_3rd: 0,
    visibility: 'public',
    system: 'elimination'
  });

  const calculatePrizes = () => {
    const total = (formData.entry_price * formData.max_participants) * 0.9;
    return {
      max: total,
      suggestion: {
        first: Math.round(total * 0.5),
        second: Math.round(total * 0.3),
        third: Math.round(total * 0.2)
      }
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'max_participants' || name === 'min_participants' || name === 'entry_price' ? parseInt(value) || 0 : value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.start_date) newErrors.start_date = 'La date de début est requise';
    if (!formData.end_date) newErrors.end_date = 'La date de fin est requise';
    if (!formData.registration_deadline) newErrors.registration_deadline = 'La date limite d\'inscription est requise';
    
    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
    const regDeadline = new Date(formData.registration_deadline);
    const now = new Date();

    if (startDateTime < now) newErrors.start_date = 'La date de début doit être dans le futur';
    if (endDateTime <= startDateTime) newErrors.end_date = 'La date de fin doit être après la date de début';
    if (regDeadline >= startDateTime) newErrors.registration_deadline = 'La limite d\'inscription doit être avant le début';
    
    if (formData.min_participants < 2) newErrors.min_participants = 'Minimum 2 joueurs requis';
    if (formData.min_participants > formData.max_participants) newErrors.min_participants = 'Le minimum ne peut pas dépasser le maximum';

    const totalPrizes = formData.prize_1st + formData.prize_2nd + formData.prize_3rd;
    const maxAvailable = calculatePrizes().max;
    if (totalPrizes > maxAvailable) newErrors.prizes = `Les gains dépassent le maximum disponible (${Math.round(maxAvailable)})`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTournament = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

      const tournamentData = {
        name: formData.name,
        description: formData.description,
        game_type: formData.game_type,
        time_control: formData.time_control,
        difficulty: formData.difficulty,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        registration_deadline: new Date(formData.registration_deadline).toISOString(),
        max_participants: formData.max_participants,
        min_participants: formData.min_participants,
        entry_price: formData.entry_price,
        prize_1st: formData.prize_1st,
        prize_2nd: formData.prize_2nd,
        prize_3rd: formData.prize_3rd,
        visibility: formData.visibility,
        system: formData.system,
        status: 'upcoming',
        creator_id: user?.id,
        creator_name: user?.full_name,
        participants: []
      };

      await base44.entities.Tournament.create(tournamentData);
      toast.success('🏆 Tournoi créé avec succès!', {
        description: `${formData.name} est maintenant en ligne`
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors de la création du tournoi');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const prizes = calculatePrizes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 -m-6 mb-0 p-6 rounded-t-lg">
          <DialogTitle className="text-3xl font-black text-white flex items-center gap-2">
            🏆 Créer votre tournoi
          </DialogTitle>
          <DialogDescription className="text-white/80 mt-1">
            Organisez une compétition personnalisée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* INFOS DE BASE */}
          <section>
            <h3 className="text-lg font-bold text-[#D4A574] mb-4">📋 Informations de base</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Nom du tournoi *</label>
                <Input 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Grand Prix Dames 2026"
                  className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Description (optionnel)</label>
                <textarea 
                  name="description" 
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre tournoi..."
                  className="w-full bg-white/5 border border-[#D4A574]/30 text-[#F5E6D3] rounded-lg px-3 py-2 text-sm h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#D4A574] block mb-1">Jeu *</label>
                  <select name="game_type" value={formData.game_type} onChange={handleChange} className="w-full bg-white/5 border border-[#D4A574]/30 text-[#F5E6D3] rounded-lg px-3 py-2 text-sm">
                    <option value="chess">♔ Échecs</option>
                    <option value="checkers">⚫ Dames</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#D4A574] block mb-1">Cadence *</label>
                  <select name="time_control" value={formData.time_control} onChange={handleChange} className="w-full bg-white/5 border border-[#D4A574]/30 text-[#F5E6D3] rounded-lg px-3 py-2 text-sm">
                    <option value="bullet">⚡ Bullet</option>
                    <option value="blitz">💨 Blitz</option>
                    <option value="rapid">🐎 Rapide</option>
                    <option value="classic">🕐 Classique</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#D4A574] block mb-1">Difficulté *</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-white/5 border border-[#D4A574]/30 text-[#F5E6D3] rounded-lg px-3 py-2 text-sm">
                    <option value="beginner">🟢 Débutant</option>
                    <option value="intermediate">🟡 Intermédiaire</option>
                    <option value="advanced">🔴 Avancé</option>
                    <option value="expert">🟣 Expert</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* DATES */}
          <section>
            <h3 className="text-lg font-bold text-[#D4A574] mb-4">📅 Dates et horaires</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#D4A574] block mb-1">Date de début *</label>
                  <Input 
                    type="date" 
                    name="start_date" 
                    value={formData.start_date}
                    onChange={handleChange}
                    className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                  />
                  {errors.start_date && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.start_date}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-[#D4A574] block mb-1">Heure de début</label>
                  <Input 
                    type="time" 
                    name="start_time" 
                    value={formData.start_time}
                    onChange={handleChange}
                    className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#D4A574] block mb-1">Date de fin *</label>
                  <Input 
                    type="date" 
                    name="end_date" 
                    value={formData.end_date}
                    onChange={handleChange}
                    className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                  />
                  {errors.end_date && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.end_date}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-[#D4A574] block mb-1">Heure de fin</label>
                  <Input 
                    type="time" 
                    name="end_time" 
                    value={formData.end_time}
                    onChange={handleChange}
                    className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Limite d'inscription *</label>
                <Input 
                  type="date" 
                  name="registration_deadline" 
                  value={formData.registration_deadline}
                  onChange={handleChange}
                  className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                />
                {errors.registration_deadline && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.registration_deadline}</p>}
              </div>
            </div>
          </section>

          {/* PARTICIPANTS */}
          <section>
            <h3 className="text-lg font-bold text-[#D4A574] mb-4">👥 Participants</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Max de joueurs *</label>
                <select name="max_participants" value={formData.max_participants} onChange={handleChange} className="w-full bg-white/5 border border-[#D4A574]/30 text-[#F5E6D3] rounded-lg px-3 py-2 text-sm">
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                  <option value={64}>64</option>
                  <option value={128}>128</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Min pour démarrer *</label>
                <Input 
                  type="number" 
                  name="min_participants" 
                  value={formData.min_participants}
                  onChange={handleChange}
                  min={2}
                  className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                />
                {errors.min_participants && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.min_participants}</p>}
              </div>
            </div>
          </section>

          {/* FINANCES */}
          <section>
            <h3 className="text-lg font-bold text-[#D4A574] mb-4">💎 Finances</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Prix d'entrée (gemmes) *</label>
                <Input 
                  type="number" 
                  name="entry_price" 
                  value={formData.entry_price}
                  onChange={handleChange}
                  min={0}
                  placeholder="0 = gratuit"
                  className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
                />
                <p className="text-xs text-[#D4A574]/70 mt-1">
                  Cagnotte: {Math.round(formData.entry_price * formData.max_participants)} - 10% = {Math.round(prizes.max)} gemmes disponibles
                </p>
              </div>

              <div className="bg-white/5 border border-[#D4A574]/20 rounded-lg p-3">
                <p className="text-xs font-bold text-[#D4A574] mb-3">Répartition des gains</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-[#D4A574]/70 block mb-1">🥇 1er place</label>
                    <Input 
                      type="number" 
                      name="prize_1st" 
                      value={formData.prize_1st}
                      onChange={handleChange}
                      min={0}
                      placeholder={prizes.suggestion.first}
                      className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#D4A574]/70 block mb-1">🥈 2e place</label>
                    <Input 
                      type="number" 
                      name="prize_2nd" 
                      value={formData.prize_2nd}
                      onChange={handleChange}
                      min={0}
                      placeholder={prizes.suggestion.second}
                      className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#D4A574]/70 block mb-1">🥉 3e place</label>
                    <Input 
                      type="number" 
                      name="prize_3rd" 
                      value={formData.prize_3rd}
                      onChange={handleChange}
                      min={0}
                      placeholder={prizes.suggestion.third}
                      className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3] text-xs"
                    />
                  </div>
                </div>
              </div>

              {errors.prizes && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.prizes}</p>}
            </div>
          </section>

          {/* PARAMÈTRES */}
          <section>
            <h3 className="text-lg font-bold text-[#D4A574] mb-4">⚙️ Paramètres</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Visibilité *</label>
                <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full bg-white/5 border border-[#D4A574]/30 text-[#F5E6D3] rounded-lg px-3 py-2 text-sm">
                  <option value="public">🌍 Public</option>
                  <option value="private">🔒 Privé (invitation)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#D4A574] block mb-1">Système *</label>
                <select name="system" value={formData.system} onChange={handleChange} className="w-full bg-white/5 border border-[#D4A574]/30 text-[#F5E6D3] rounded-lg px-3 py-2 text-sm">
                  <option value="elimination">🏆 Élimination</option>
                  <option value="round-robin">🔄 Round-robin</option>
                  <option value="swiss">⚔️ Suisse</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="bg-white/5 border-t border-[#D4A574]/20 p-4">
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-[#D4A574]/30 text-[#F5E6D3]"
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleCreateTournament}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Créer le tournoi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}