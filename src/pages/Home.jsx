import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import GameCard from '../components/game/GameCard';
import QuickAccessButton from '../components/game/QuickAccessButton';
import LiveTournaments from '../components/home/LiveTournaments';
import Colisee from '../components/home/Colisee';
import { Crown, ShoppingBag, UserPlus, Building, Puzzle, Trophy, TrendingUp, Swords, ChevronRight } from 'lucide-react';
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
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto px-4 py-6"
    >
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-[#F5E6D3] mb-3">
          Bienvenue, <span className="text-[#D4A574]">{user?.full_name || 'Joueur'}</span>
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-[#D4A574]/80">
            <Crown className="w-4 h-4 text-[#D4A574]" />
            <span>Niveau {user?.level || 1}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#D4A574]/80">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75"></div>
            </div>
            <span>{onlineCount} en ligne</span>
          </div>
        </div>
      </motion.div>

      {/* Challenge Banner */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6"
      >
        <Link 
          to={createPageUrl('Leaderboard')}
          className="block p-4 rounded-xl border border-[#D4A574]/25 hover:border-[#D4A574]/50 transition-all group overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(212,165,116,0.08) 0%, rgba(139,90,43,0.05) 100%)' }}
        >
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/5 to-transparent pointer-events-none"
          />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A574] to-[#8B5A2B] flex items-center justify-center shadow-lg shadow-[#D4A574]/20">
                <TrendingUp className="w-5 h-5 text-[#2C1810]" />
              </div>
              <div>
                <p className="text-xs text-[#D4A574] uppercase tracking-wider font-semibold">Défi du jour</p>
                <p className="font-bold text-[#F5E6D3] text-sm">Grimpez le classement !</p>
              </div>
            </div>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[#D4A574]"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
        </Link>
      </motion.div>

      {/* Live Tournaments */}
      <LiveTournaments />

      {/* Colisée */}
      <Colisee />

      {/* Game Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-xs font-bold text-[#D4A574]/60 uppercase tracking-widest mb-4">Jeux</h2>
        <div className="grid grid-cols-2 gap-4">
          {games.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.08 }}
            >
              <GameCard {...game} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-[#D4A574]/60 uppercase tracking-widest mb-4">Accès rapide</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickAccess.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.07 }}
            >
              <QuickAccessButton {...item} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Play Button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
      >
        <Link
          to={createPageUrl('Play')}
          className="block w-full relative overflow-hidden rounded-xl shadow-2xl shadow-[#D4A574]/20"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-4 bg-gradient-to-r from-[#D4A574] via-[#c49060] to-[#8B5A2B] text-[#2C1810] font-black text-lg tracking-wide flex items-center justify-center gap-3 rounded-xl"
          >
            <Swords className="w-6 h-6" />
            Jouer maintenant
          </motion.button>
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-xl"
          />
        </Link>
      </motion.div>
    </motion.div>
  );
}