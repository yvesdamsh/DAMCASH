import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Crown, Circle, Target, TrendingUp, Award, Gem, Star } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <Award className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">Connectez-vous</h2>
        <p className="text-gray-400 mb-4">Pour voir votre profil</p>
        <Button 
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-amber-500 to-amber-600"
        >
          Se connecter
        </Button>
      </div>
    );
  }

  const xpForNextLevel = (user.level || 1) * 100;
  const currentXp = user.xp || 0;
  const xpProgress = (currentXp / xpForNextLevel) * 100;

  const stats = [
    { label: 'Parties jouées', value: user.games_played || 0, icon: <Target className="w-5 h-5" /> },
    { label: 'Victoires', value: user.games_won || 0, icon: <Trophy className="w-5 h-5" /> },
    { label: 'Taux de victoire', value: user.games_played ? Math.round((user.games_won / user.games_played) * 100) + '%' : '0%', icon: <TrendingUp className="w-5 h-5" /> }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="text-center mb-8">
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-amber-500/50">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="bg-amber-900 text-amber-200 text-3xl">
            {user.full_name?.charAt(0) || 'J'}
          </AvatarFallback>
        </Avatar>
        
        <h1 className="text-2xl font-bold text-white mb-1">{user.full_name}</h1>
        <p className="text-gray-400 mb-4">{user.email}</p>

        {/* Level Progress */}
        <div className="max-w-xs mx-auto mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4" />
              Niveau {user.level || 1}
            </span>
            <span className="text-gray-400">{currentXp} / {xpForNextLevel} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2 bg-white/10" />
        </div>

        <div className="flex items-center justify-center gap-2">
          <Gem className="w-5 h-5 text-cyan-400" />
          <span className="text-xl font-bold text-amber-200">{user.gems || 100} gemmes</span>
        </div>
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{user.chess_rating || 1200}</div>
            <div className="text-sm text-gray-400">Classement Échecs</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Circle className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{user.checkers_rating || 1200}</div>
            <div className="text-sm text-gray-400">Classement Dames</div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  {stat.icon}
                </div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        onClick={() => base44.auth.logout()}
        variant="outline"
        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
      >
        Déconnexion
      </Button>
    </div>
  );
}