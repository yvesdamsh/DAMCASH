import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Crown, ShoppingBag, UserPlus, Building, Gem, TrendingUp, ChevronRight, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OnlinePlayersList from '@/components/home/OnlinePlayersList';

export default function Home() {
  const [user, setUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [universe, setUniverse] = useState('chess'); // 'chess' | 'checkers'

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.preferred_universe) {
      setUniverse(user.preferred_universe);
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (!user) return;
    const updatePresence = async () => {
      try {
        const existing = await base44.entities.OnlineUser.filter({ user_id: user.id });
        if (existing.length > 0) {
          await base44.entities.OnlineUser.update(existing[0].id, { last_seen: new Date().toISOString(), status: 'online', username: user.full_name });
        } else {
          await base44.entities.OnlineUser.create({ user_id: user.id, username: user.full_name, last_seen: new Date().toISOString(), status: 'online' });
        }
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const allUsers = await base44.entities.OnlineUser.list();
        for (const u of allUsers) {
          if (u.last_seen < twoMinutesAgo) await base44.entities.OnlineUser.delete(u.id);
        }
      } catch (e) {}
    };
    updatePresence();
    const interval = setInterval(updatePresence, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const activeUsers = await base44.entities.OnlineUser.list();
        setOnlineCount(activeUsers.length);
      } catch (e) {}
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  const isChess = universe === 'chess';

  const quickAccess = [
    { icon: <ShoppingBag className="w-5 h-5 text-amber-400" />, label: 'Boutique', page: 'Shop' },
    { icon: <UserPlus className="w-5 h-5 text-green-400" />, label: 'Amis', page: 'Friends' },
    { icon: <Building className="w-5 h-5 text-blue-400" />, label: 'Clubs', page: 'Clubs' },
    { icon: <Gem className="w-5 h-5 text-purple-400" />, label: 'Boutique', page: 'Shop' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5E6D3] mb-2">
          Bienvenue, <span className="text-[#D4A574]">{user?.full_name || 'Joueur'}</span>
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-[#D4A574]/80">
            <Crown className="w-4 h-4 text-[#D4A574]" />
            <span>Niveau {user?.level || 1}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#D4A574]/80">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
            </div>
            <span>{onlineCount} en ligne</span>
          </div>
        </div>
      </motion.div>

      {/* ====== UNIVERSE SWITCHER HERO ====== */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="mb-8">
        {/* Toggle pills */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={async () => {
              setUniverse('chess');
              if (user) await base44.auth.updateMe({ preferred_universe: 'chess' });
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm transition-all border ${
              isChess
                ? 'bg-gradient-to-r from-amber-700 to-orange-700 border-amber-500/50 text-white shadow-lg shadow-amber-900/40'
                : 'bg-black/20 border-[#D4A574]/20 text-[#D4A574]/50 hover:text-[#D4A574]'
            }`}
          >
            ♟️ Échecs
          </button>
          <button
            onClick={async () => {
              setUniverse('checkers');
              if (user) await base44.auth.updateMe({ preferred_universe: 'checkers' });
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm transition-all border ${
              !isChess
                ? 'bg-gradient-to-r from-blue-800 to-cyan-700 border-blue-500/50 text-white shadow-lg shadow-blue-900/40'
                : 'bg-black/20 border-[#D4A574]/20 text-[#D4A574]/50 hover:text-[#D4A574]'
            }`}
          >
            ⚫ Dames
          </button>
        </div>

        {/* Universe card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={universe}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-2xl border p-6"
            style={isChess
              ? { background: 'linear-gradient(135deg, #2a1200 0%, #3d1a00 50%, #1e0d00 100%)', borderColor: 'rgba(217,119,6,0.3)' }
              : { background: 'linear-gradient(135deg, #001a2e 0%, #002a45 50%, #001020 100%)', borderColor: 'rgba(59,130,246,0.3)' }
            }
          >
            {/* BG pattern */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
              backgroundImage: isChess
                ? 'radial-gradient(circle at 1px 1px, #F59E0B 1px, transparent 0)'
                : 'radial-gradient(circle at 1px 1px, #3B82F6 1px, transparent 0)',
              backgroundSize: '30px 30px'
            }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{
              background: isChess
                ? 'linear-gradient(90deg, transparent, rgba(217,119,6,0.6), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)'
            }} />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-5">
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl"
                >
                  {isChess ? (
                     <span style={{
                       display: 'inline-block',
                       fontSize: '2.8rem',
                       filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.7)) drop-shadow(0 2px 4px rgba(217,119,6,0.4))',
                       textShadow: 'none'
                     }}>♟</span>
                   ) : (
                     <span style={{
                       display: 'inline-block',
                       width: '52px',
                       height: '52px',
                       borderRadius: '50%',
                       background: 'radial-gradient(circle at 35% 35%, #6b7280, #1f2937 55%, #111827)',
                       boxShadow: '0 8px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.5), 0 2px 8px rgba(59,130,246,0.3)',
                       border: '2px solid rgba(107,114,128,0.4)',
                       position: 'relative'
                     }}>
                       <span style={{
                         position: 'absolute',
                         top: '30%',
                         left: '30%',
                         width: '30%',
                         height: '20%',
                         borderRadius: '50%',
                         background: 'rgba(255,255,255,0.2)',
                         transform: 'rotate(-30deg)'
                       }} />
                     </span>
                   )}
                </motion.span>
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {isChess ? 'Univers Échecs' : 'Univers Dames'}
                  </h2>
                  <p className={`text-sm ${isChess ? 'text-amber-400/70' : 'text-blue-400/70'}`}>
                    {isChess ? 'Stratégie & maîtrise tactique' : 'Classique & accessible à tous'}
                  </p>
                </div>
              </div>

              {/* Main CTA */}
              <Link to={createPageUrl(isChess ? 'Chess' : 'Checkers')} className="block mb-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-xl font-black text-base tracking-wide flex items-center justify-center gap-3 relative overflow-hidden ${
                    isChess
                      ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-900/40'
                      : 'bg-gradient-to-r from-blue-700 to-cyan-700 text-white shadow-lg shadow-blue-900/40'
                  }`}
                >
                  {isChess ? '♟️ Entrer dans l\'univers Échecs' : '⚫ Entrer dans l\'univers Dames'}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                  />
                </motion.button>
              </Link>

              {/* Sub-links */}
              <div className="grid grid-cols-2 gap-2">
                <Link to={`${createPageUrl('Tournaments')}?game=${universe}`}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    isChess ? 'border-amber-600/30 text-amber-400/80 hover:bg-amber-900/20' : 'border-blue-600/30 text-blue-400/80 hover:bg-blue-900/20'
                  }`}>
                  🏆 Tournois
                </Link>
                <Link to={`${createPageUrl('MiniTournaments')}?game=${universe}`}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    isChess ? 'border-amber-600/30 text-amber-400/80 hover:bg-amber-900/20' : 'border-blue-600/30 text-blue-400/80 hover:bg-blue-900/20'
                  }`}>
                  ⚔️ Salons
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Challenge Banner */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="mb-6">
        <Link
          to={createPageUrl('Leaderboard')}
          className="block p-4 rounded-xl border border-[#D4A574]/25 hover:border-[#D4A574]/50 transition-all group overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(212,165,116,0.08) 0%, rgba(139,90,43,0.05) 100%)' }}
        >
          <motion.div
            animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
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
            <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-[#D4A574]">
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
        </Link>
      </motion.div>

      {/* Quick Access */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6">
        <h2 className="text-xs font-bold text-[#D4A574]/60 uppercase tracking-widest mb-4">Accès rapide</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <ShoppingBag className="w-5 h-5 text-amber-400" />, label: 'Boutique', page: 'Shop' },
            { icon: <UserPlus className="w-5 h-5 text-green-400" />, label: 'Amis', page: 'Friends' },
            { icon: <Building className="w-5 h-5 text-blue-400" />, label: 'Clubs', page: 'Clubs' },
            { icon: <History className="w-5 h-5 text-amber-400" />, label: 'Historique', page: 'History' },
          ].map((item, i) => (
            <motion.div key={item.page} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.07 }}>
              <Link to={createPageUrl(item.page)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#D4A574]/15 hover:border-[#D4A574]/40 bg-black/20 transition-all">
                {item.icon}
                <span className="text-xs text-[#F5E6D3]/70 font-semibold">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}