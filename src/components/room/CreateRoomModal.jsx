import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export default function CreateRoomModal({ isOpen, onClose, user, onRoomCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    game_type: 'checkers',
    is_private: false,
    time_control: 'classic',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !user) return;

    setLoading(true);
    try {
      const room = await base44.entities.Room.create({
        name: formData.name,
        description: formData.description,
        owner_id: user.id,
        owner_name: user.full_name,
        game_type: formData.game_type,
        is_private: formData.is_private,
        time_control: formData.time_control,
        password: formData.is_private ? formData.password : '',
        players: [user.id],
        current_players: 1,
        status: 'waiting',
        created_at: new Date().toISOString()
      });

      onRoomCreated(room);
      setFormData({
        name: '',
        description: '',
        game_type: 'checkers',
        is_private: false,
        time_control: 'classic',
        password: ''
      });
      onClose();
    } catch (error) {
      console.error('Erreur création salon:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2C1810]/80 backdrop-blur-xl border border-[#D4A574]/40 text-[#F5E6D3] shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle>Créer un salon</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Nom */}
            <div>
              <label className="text-sm text-[#D4A574] mb-1 block">Nom du salon</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Partie amicale"
                className="w-full bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-[#D4A574] mb-1 block">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
                className="w-full bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574] h-20"
              />
            </div>

            {/* Jeu */}
            <div>
              <label className="text-sm text-[#D4A574] mb-1 block">Type de jeu</label>
              <select
                value={formData.game_type}
                onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
                className="w-full bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]"
              >
                <option value="checkers">Dames</option>
                <option value="chess">Échecs</option>
              </select>
            </div>

            {/* Temps */}
            <div>
              <label className="text-sm text-[#D4A574] mb-1 block">Contrôle du temps</label>
              <select
                value={formData.time_control}
                onChange={(e) => setFormData({ ...formData, time_control: e.target.value })}
                className="w-full bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]"
              >
                <option value="bullet">Bullet (1 min)</option>
                <option value="blitz">Blitz (3 min)</option>
                <option value="rapid">Rapide (10 min)</option>
                <option value="classic">Classique (30 min)</option>
                <option value="unlimited">Illimité</option>
              </select>
            </div>

            {/* Privé */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_private"
                checked={formData.is_private}
                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="is_private" className="text-sm text-[#D4A574] cursor-pointer">
                Salon privé
              </label>
            </div>

            {/* Mot de passe */}
            {formData.is_private && (
              <div>
                <label className="text-sm text-[#D4A574] mb-1 block">Mot de passe</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mot de passe du salon"
                  className="w-full bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]"
                  required={formData.is_private}
                />
              </div>
            )}
          </motion.div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-[#D4A574]/30 text-[#F5E6D3] hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || loading}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}