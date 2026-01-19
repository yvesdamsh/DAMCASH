import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAvatar from '@/components/ui/UserAvatar';
import { ArrowLeft, MessageSquare, BarChart3, History, Award, Settings, Camera, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import MessagesTab from '../components/profile/MessagesTab';
import StatsTab from '../components/profile/StatsTab';
import HistoryTab from '../components/profile/HistoryTab';
import BadgesTab from '../components/profile/BadgesTab';
import SettingsTab from '../components/profile/SettingsTab';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      navigate('/Home');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non autorisé (JPG, PNG, GIF seulement)');
      return;
    }

    // Validation de la taille (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5MB)');
      return;
    }

    try {
      setUploadingAvatar(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({ avatar_url: file_url });
      
      setUser(prev => ({ ...prev, avatar_url: file_url }));
      toast.success('📷 Photo mise à jour!');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
      console.error(error);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4A574]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex items-center justify-center">
        <p>Vous devez être connecté</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3E2723] to-[#2C1810] border-b-2 border-[#D4A574]/40 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/Home')}
            className="text-[#F5E6D3] hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/10 to-white/5 border border-[#D4A574]/30 rounded-xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <UserAvatar user={user} size="3xl" className="border-4" />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:bg-black/50"
              >
                {uploadingAvatar ? (
                  <Loader className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-black text-white mb-2">{user?.full_name}</h2>
              <p className="text-[#D4A574] text-lg mb-4">Niveau {user?.level || 1} • {user?.games_played || 0} parties</p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="bg-white/10 rounded-lg px-4 py-2 border border-[#D4A574]/20">
                  <p className="text-xs text-[#D4A574]">Victoires</p>
                  <p className="font-bold">{user?.games_won || 0}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 border border-[#D4A574]/20">
                  <p className="text-xs text-[#D4A574]">Classement Échecs</p>
                  <p className="font-bold">{user?.chess_rating || 1200}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 border border-[#D4A574]/20">
                  <p className="text-xs text-[#D4A574]">Classement Dames</p>
                  <p className="font-bold">{user?.checkers_rating || 1200}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 border border-[#D4A574]/20">
                  <p className="text-xs text-[#D4A574]">Gemmes</p>
                  <p className="font-bold">{user?.gems || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="flex flex-wrap gap-2 bg-transparent border-0 p-0 mb-8 h-auto">
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 px-5 py-3 rounded-lg border-0 text-sm font-medium bg-transparent text-[#D4A574]/70 hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              📊 Statistiques
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 px-5 py-3 rounded-lg border-0 text-sm font-medium bg-transparent text-[#D4A574]/70 hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              📩 Messages
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 px-5 py-3 rounded-lg border-0 text-sm font-medium bg-transparent text-[#D4A574]/70 hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
            >
              <History className="w-4 h-4" />
              📜 Historique
            </TabsTrigger>
            <TabsTrigger 
              value="badges" 
              className="flex items-center gap-2 px-5 py-3 rounded-lg border-0 text-sm font-medium bg-transparent text-[#D4A574]/70 hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
            >
              <Award className="w-4 h-4" />
              🏆 Badges
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 px-5 py-3 rounded-lg border-0 text-sm font-medium bg-transparent text-[#D4A574]/70 hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
              ⚙️ Paramètres
            </TabsTrigger>
          </TabsList>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <TabsContent value="stats" className="bg-transparent">
              <StatsTab user={user} />
            </TabsContent>

            <TabsContent value="history" className="bg-transparent">
              <HistoryTab user={user} />
            </TabsContent>

            <TabsContent value="messages" className="bg-transparent">
              <MessagesTab user={user} />
            </TabsContent>

            <TabsContent value="badges" className="bg-transparent">
              <BadgesTab user={user} />
            </TabsContent>

            <TabsContent value="settings" className="bg-transparent">
              <SettingsTab user={user} onUserUpdate={loadUser} />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
}