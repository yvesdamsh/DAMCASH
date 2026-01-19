import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, Lock, Bell, Eye } from 'lucide-react';

export default function SettingsTab({ user, onUserUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.full_name || '',
    password: '',
    notifications: user?.notifications_enabled !== false,
    profile_public: user?.profile_public !== false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({ avatar_url: file_url });
      onUserUpdate?.();
      toast.success('Avatar mis à jour!');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await base44.auth.updateMe({
        full_name: formData.username,
        notifications_enabled: formData.notifications,
        profile_public: formData.profile_public
      });

      if (formData.password) {
        toast.success('Paramètres et mot de passe mis à jour!');
      } else {
        toast.success('Paramètres mis à jour!');
      }
      
      onUserUpdate?.();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Avatar */}
      <section className="bg-white/5 border border-[#D4A574]/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-[#D4A574] mb-4">📸 Avatar</h3>
        <div className="flex items-center gap-6">
          <img
            src={user?.avatar_url || 'https://via.placeholder.com/100'}
            alt="Avatar"
            className="w-24 h-24 rounded-full border-2 border-[#D4A574] object-cover"
          />
          <label className="relative">
            <Button className="bg-[#D4A574] hover:bg-[#D4A574]/80 text-[#2C1810] font-bold flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Changer l'avatar
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* Profil */}
      <section className="bg-white/5 border border-[#D4A574]/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-[#D4A574] mb-4">👤 Profil</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#D4A574] block mb-2">Nom d'utilisateur</label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#D4A574] block mb-2">Nouveau mot de passe (optionnel)</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Laisser vide pour garder le mot de passe actuel"
              className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
            />
          </div>
        </div>
      </section>

      {/* Préférences */}
      <section className="bg-white/5 border border-[#D4A574]/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-[#D4A574] mb-4">⚙️ Préférences</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="notifications"
              checked={formData.notifications}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-semibold text-sm flex items-center gap-2"><Bell className="w-4 h-4" />Activer les notifications</p>
              <p className="text-xs text-[#D4A574]/70">Recevoir les notifications de messages et tournois</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="profile_public"
              checked={formData.profile_public}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-semibold text-sm flex items-center gap-2"><Eye className="w-4 h-4" />Profil public</p>
              <p className="text-xs text-[#D4A574]/70">Autoriser d'autres joueurs à voir votre profil</p>
            </div>
          </label>
        </div>
      </section>

      {/* Bouton Save */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <Button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold"
        >
          {loading ? 'Enregistrement...' : '✅ Enregistrer les modifications'}
        </Button>
      </motion.div>
    </div>
  );
}