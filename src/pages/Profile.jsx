import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Trophy, Crown, Gem, Edit2, Save, X, 
  Camera, Bell, Moon, Sun, History, Award, TrendingUp,
  Target, Zap, Shield, Star, Upload, LogOut
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = '/';
        return;
      }
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setEditedName(currentUser.full_name || '');
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    try {
      await base44.auth.updateMe({ full_name: editedName });
      setUser({ ...user, full_name: editedName });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      setUser({ ...user, avatar_url: file_url });
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };



  const calculateWinRate = () => {
    if (!user?.games_played || user.games_played === 0) return 0;
    return Math.round((user.games_won / user.games_played) * 100);
  };

  const calculateLevelProgress = () => {
    if (!user?.xp) return 0;
    const xpNeeded = (user.level || 1) * 1000;
    return Math.round((user.xp / xpNeeded) * 100);
  };

  // Mock data for achievements and history
  const achievements = [
    { id: 1, name: 'Premier Sang', description: 'Gagner votre première partie', icon: '🎯', unlocked: true },
    { id: 2, name: 'Série de Victoires', description: 'Gagner 5 parties consécutives', icon: '🔥', unlocked: true },
    { id: 3, name: 'Maître Stratège', description: 'Atteindre 1500 de classement', icon: '🧠', unlocked: user?.chess_rating >= 1500 },
    { id: 4, name: 'Champion Légendaire', description: 'Gagner un tournoi', icon: '👑', unlocked: false },
    { id: 5, name: 'Collectionneur', description: 'Posséder 10 thèmes', icon: '💎', unlocked: false },
    { id: 6, name: 'Social', description: 'Avoir 20 amis', icon: '👥', unlocked: false },
  ];

  const matchHistory = [
    { id: 1, game: 'Échecs', result: 'Victoire', opponent: 'Jean Dupont', date: new Date(Date.now() - 3600000), rating_change: +25 },
    { id: 2, game: 'Dames', result: 'Défaite', opponent: 'Marie Martin', date: new Date(Date.now() - 7200000), rating_change: -15 },
    { id: 3, game: 'Échecs', result: 'Victoire', opponent: 'Pierre Durand', date: new Date(Date.now() - 86400000), rating_change: +30 },
    { id: 4, game: 'Échecs', result: 'Égalité', opponent: 'Sophie Bernard', date: new Date(Date.now() - 172800000), rating_change: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4A574]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <User className="w-16 h-16 mx-auto mb-4 text-[#D4A574]" />
        <h2 className="text-2xl font-bold text-[#F5E6D3] mb-2">Non connecté</h2>
        <p className="text-[#F5E6D3]/70">Veuillez vous connecter pour voir votre profil</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-6 pb-20"
    >
      {/* Header Profile Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative mb-6 p-6 rounded-2xl premium-gradient border border-[#D4A574]/30 shadow-2xl overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle, #D4A574 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with upload */}
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-[#D4A574] shadow-xl">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-[#5D3A1A] text-[#F5E6D3] text-4xl font-bold">
                {user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="photo-upload" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* User info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-xs"
                  />
                  <Button onClick={handleSaveName} size="icon" className="bg-[#D4A574] hover:bg-[#8B5A2B] text-[#2C1810]">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => setIsEditing(false)} size="icon" variant="outline" className="border-[#D4A574]/50">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-[#F5E6D3]">{user.full_name}</h1>
                  <Button onClick={() => setIsEditing(true)} size="icon" variant="ghost" className="text-[#D4A574] hover:bg-[#D4A574]/10">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-[#F5E6D3]/70 justify-center sm:justify-start mb-4">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>

            {/* Level progress */}
            <div className="max-w-md mx-auto sm:mx-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#D4A574]" />
                  <span className="font-bold text-[#F5E6D3]">Niveau {user.level || 1}</span>
                </div>
                <span className="text-sm text-[#F5E6D3]/70">{user.xp || 0} / {(user.level || 1) * 1000} XP</span>
              </div>
              <div className="h-3 bg-[#2C1810] rounded-full overflow-hidden border border-[#D4A574]/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateLevelProgress()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full gold-gradient shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Gems display */}
          <div className="flex flex-col items-center gap-2 p-4 bg-[#2C1810]/50 rounded-xl border border-[#D4A574]/30">
            <Gem className="w-8 h-8 text-[#D4A574]" />
            <span className="text-3xl font-bold text-[#F5E6D3]">{user.gems || 100}</span>
            <span className="text-xs text-[#F5E6D3]/70">Gemmes</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Target, label: 'Parties', value: user.games_played || 0, color: 'text-blue-400' },
          { icon: Trophy, label: 'Victoires', value: user.games_won || 0, color: 'text-green-400' },
          { icon: TrendingUp, label: 'Taux victoire', value: `${calculateWinRate()}%`, color: 'text-purple-400' },
          { icon: Zap, label: 'Classement', value: user.chess_rating || 1200, color: 'text-[#D4A574]' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-[#5D3A1A]/30 border border-[#D4A574]/20 backdrop-blur-sm"
          >
            <stat.icon className={`w-6 h-6 mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold text-[#F5E6D3]">{stat.value}</div>
            <div className="text-xs text-[#F5E6D3]/70">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#5D3A1A]/30 border border-[#D4A574]/20">
          <TabsTrigger value="stats" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810]">
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810]">
            Historique
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810]">
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <Card className="p-6 bg-[#5D3A1A]/30 border-[#D4A574]/20">
            <h3 className="text-xl font-bold text-[#F5E6D3] mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4A574]" />
              Classements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#2C1810]/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">♔</span>
                  <div>
                    <div className="font-semibold text-[#F5E6D3]">Échecs</div>
                    <div className="text-sm text-[#F5E6D3]/70">Classement Elo</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#D4A574]">{user.chess_rating || 1200}</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#2C1810]/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚫</span>
                  <div>
                    <div className="font-semibold text-[#F5E6D3]">Dames</div>
                    <div className="text-sm text-[#F5E6D3]/70">Classement Elo</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#D4A574]">{user.checkers_rating || 1200}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#5D3A1A]/30 border-[#D4A574]/20">
            <h3 className="text-xl font-bold text-[#F5E6D3] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4A574]" />
              Achievements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    achievement.unlocked
                      ? 'bg-[#D4A574]/20 border-[#D4A574]/50'
                      : 'bg-[#2C1810]/30 border-[#D4A574]/10 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="font-semibold text-sm text-[#F5E6D3] mb-1">{achievement.name}</div>
                  <div className="text-xs text-[#F5E6D3]/70">{achievement.description}</div>
                  {achievement.unlocked && (
                    <Badge className="mt-2 bg-[#D4A574] text-[#2C1810]">Débloqué</Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="p-6 bg-[#5D3A1A]/30 border-[#D4A574]/20">
            <h3 className="text-xl font-bold text-[#F5E6D3] mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[#D4A574]" />
              Dernières Parties
            </h3>
            <div className="space-y-3">
              {matchHistory.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-[#2C1810]/50 rounded-lg hover:bg-[#2C1810]/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      match.result === 'Victoire' ? 'bg-green-500' :
                      match.result === 'Défaite' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <div className="font-semibold text-[#F5E6D3]">{match.game}</div>
                      <div className="text-sm text-[#F5E6D3]/70">vs {match.opponent}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      match.result === 'Victoire' ? 'text-green-400' :
                      match.result === 'Défaite' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {match.result}
                    </div>
                    <div className="text-sm text-[#F5E6D3]/70">
                      {match.rating_change > 0 ? '+' : ''}{match.rating_change}
                    </div>
                    <div className="text-xs text-[#F5E6D3]/50">
                      {formatDistanceToNow(match.date, { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card className="p-6 bg-[#5D3A1A]/30 border-[#D4A574]/20">
            <h3 className="text-xl font-bold text-[#F5E6D3] mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#D4A574]" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#2C1810]/50 rounded-lg">
                <div>
                  <div className="font-semibold text-[#F5E6D3]">Notifications Push</div>
                  <div className="text-sm text-[#F5E6D3]/70">Recevoir des notifications en temps réel</div>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#2C1810]/50 rounded-lg">
                <div>
                  <div className="font-semibold text-[#F5E6D3]">Invitations de match</div>
                  <div className="text-sm text-[#F5E6D3]/70">Alertes pour nouvelles invitations</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#2C1810]/50 rounded-lg">
                <div>
                  <div className="font-semibold text-[#F5E6D3]">Tournois</div>
                  <div className="text-sm text-[#F5E6D3]/70">Notifications de tournois</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#5D3A1A]/30 border-[#D4A574]/20">
            <h3 className="text-xl font-bold text-[#F5E6D3] mb-4 flex items-center gap-2">
              {darkMode ? <Moon className="w-5 h-5 text-[#D4A574]" /> : <Sun className="w-5 h-5 text-[#D4A574]" />}
              Apparence
            </h3>
            <div className="flex items-center justify-between p-3 bg-[#2C1810]/50 rounded-lg">
              <div>
                <div className="font-semibold text-[#F5E6D3]">Mode Sombre</div>
                <div className="text-sm text-[#F5E6D3]/70">Activer le thème sombre</div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </Card>

          <Card className="p-6 bg-[#5D3A1A]/30 border-[#D4A574]/20">
            <h3 className="text-xl font-bold text-[#F5E6D3] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4A574]" />
              Compte
            </h3>
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}