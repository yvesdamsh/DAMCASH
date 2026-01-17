import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import GameCard from '../components/game/GameCard';
import QuickAccessButton from '../components/game/QuickAccessButton';
import { Crown, Users, ShoppingBag, UserPlus, Building, Puzzle, Trophy, TrendingUp, Eye, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(1247);

  useEffect(() => {
    loadUser();
    const interval = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 20) - 10);
    }, 5000);
    return () => clearInterval(interval);
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
        className="block mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all group"
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
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>{onlineCount.toLocaleString()} joueurs en ligne</span>
          </div>
        </div>
      </div>

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
        className="block w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
      >
        <div className="flex items-center justify-center gap-3">
          <Swords className="w-6 h-6 text-white" />
          <span className="text-lg font-bold text-white">Jouer maintenant</span>
        </div>
      </Link>
    </motion.div>
  );
}