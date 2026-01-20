import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import GameCard from '../components/game/GameCard';
import QuickAccessButton from '../components/game/QuickAccessButton';
import LiveTournaments from '../components/home/LiveTournaments';
import Colisee from '../components/home/Colisee';
import { Crown, Users, ShoppingBag, UserPlus, Building, Puzzle, Trophy, TrendingUp, Eye, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);

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
      console.log('User not authenticated');
    }
  };

  // Système de présence en ligne en temps réel
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        // Chercher si l'utilisateur existe déjà
        const existing = await base44.entities.OnlineUser.filter({ user_id: user.id });
        
        if (existing.length > 0) {
          // Mettre à jour
          await base44.entities.OnlineUser.update(existing[0].id, {
            last_seen: new Date().toISOString(),
            status: 'online',
            username: user.full_name
          });
        } else {
          // Créer nouvelle entrée
          await base44.entities.OnlineUser.create({
            user_id: user.id,
            username: user.full_name,
            last_seen: new Date().toISOString(),
            status: 'online'
          });
        }

        // Nettoyer les utilisateurs inactifs (plus de 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const allUsers = await base44.entities.OnlineUser.list();
        for (const u of allUsers) {
          if (u.last_seen < twoMinutesAgo) {
            await base44.entities.OnlineUser.delete(u.id);
          }
        }
      } catch (error) {
        console.error('Erreur mise à jour présence:', error);
      }
    };

    // Mise à jour initiale
    updatePresence();

    // Mise à jour toutes les 30 secondes
    const interval = setInterval(updatePresence, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Rafraîchir le compteur toutes les 10 secondes
  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const activeUsers = await base44.entities.OnlineUser.list();
        setOnlineCount(activeUsers.length);
      } catch (error) {
        console.error('Erreur récupération compteur:', error);
      }
    };

    // Première récupération
    fetchOnlineCount();

    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchOnlineCount, 10000);

    return () => clearInterval(interval);
  }, []);

  const games = [
    {
      title: 'Échecs',
      subtitle: 'Stratégie',
      page: 'Chess',
      gradient: 'bg-gradient-to-br from-amber-900 to-amber-700',
      image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop',
      icon: <Crown className="w-6 h-6 text-amber-400" />
    },
    {
      title: 'Dames',
      subtitle: 'Tactique',
      page: 'Checkers',
      gradient: 'bg-gradient-to-br from-blue-900 to-blue-700',
      image: 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=400&h=300&fit=crop',
      icon: <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-white"></div>
    },
    {
      title: 'Tournois',
      subtitle: 'Compétition',
      page: 'Tournaments',
      gradient: 'bg-gradient-to-br from-yellow-900 to-yellow-700',
      image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=300&fit=crop',
      icon: <Trophy className="w-6 h-6 text-yellow-400" />
    },
    {
      title: 'Spectateur',
      subtitle: 'Live',
      page: 'Spectate',
      gradient: 'bg-gradient-to-br from-purple-900 to-purple-700',
      image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400&h=300&fit=crop',
      icon: <Eye className="w-6 h-6 text-purple-400" />
    }
  ];

  const quickAccess = [
    { icon: <ShoppingBag className="w-5 h-5 text-amber-400" />, label: 'Boutique', page: 'Shop' },
    { icon: <UserPlus className="w-5 h-5 text-green-400" />, label: 'Amis', page: 'Friends' },
    { icon: <Building className="w-5 h-5 text-blue-400" />, label: 'Clubs', page: 'Clubs' },
    { icon: <Puzzle className="w-5 h-5 text-purple-400" />, label: 'Puzzles', page: 'Puzzles' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4 py-6"
    >
      {/* Challenge Banner */}
       <Link 
         to={createPageUrl('Leaderboard')}
         className="block mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all group backdrop-blur-lg shadow-lg shadow-amber-500/10"
       >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-amber-300">Défi du jour</p>
              <p className="font-bold text-white">Grimpez le classement !</p>
            </div>
          </div>
          <div className="text-amber-400 group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </Link>

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Bienvenue, {user?.full_name || 'Joueur'} 👋
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Niveau {user?.level || 1}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
            </div>
            <span>{onlineCount} joueurs en ligne</span>
          </div>
        </div>
      </div>

      {/* Live Tournaments */}
      <LiveTournaments />

      {/* Colisée */}
      <Colisee />

      {/* Game Cards Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {games.map((game) => (
          <GameCard key={game.title} {...game} />
        ))}
      </div>

      {/* Quick Access */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Accès rapide</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickAccess.map((item) => (
            <QuickAccessButton key={item.label} {...item} />
          ))}
        </div>
      </div>

      {/* Quick Play Button */}
       <Link
         to={createPageUrl('Play')}
         className="block w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-2xl shadow-amber-500/40 backdrop-blur-lg hover:scale-[1.02] transform"
       >
        <div className="flex items-center justify-center gap-3">
          <Swords className="w-6 h-6 text-white" />
          <span className="text-lg font-bold text-white">Jouer maintenant</span>
        </div>
      </Link>
    </motion.div>
  );
}