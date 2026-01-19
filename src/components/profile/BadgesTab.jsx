import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const BadgeItem = ({ icon, name, description, earned, earnedAt }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
      earned
        ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
        : 'bg-white/5 border-[#D4A574]/20 opacity-50'
    }`}
  >
    <span className={`text-4xl mb-2 ${earned ? '' : 'grayscale'}`}>{icon}</span>
    <p className="font-bold text-center text-sm">{name}</p>
    <p className="text-xs text-[#D4A574]/70 text-center mt-1">{description}</p>
    {earned && earnedAt && (
      <p className="text-xs text-yellow-400 mt-2">
        {new Date(earnedAt).toLocaleDateString('fr-FR')}
      </p>
    )}
  </motion.div>
);

export default function BadgesTab({ user }) {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (user) loadBadges();
  }, [user]);

  const loadBadges = async () => {
    try {
      const userBadges = await base44.entities.Badge.filter({ user_id: user.id });
      setBadges(userBadges);
    } catch (e) {
      console.error('Erreur chargement badges:', e);
    }
  };

  const allBadges = [
    { type: 'first_blood', icon: '🆕', name: 'Premier Sang', description: '1ère victoire' },
    { type: 'on_fire', icon: '🔥', name: 'En Feu', description: '5 victoires consécutives' },
    { type: 'champion', icon: '🏆', name: 'Champion', description: 'Gagner un tournoi' },
    { type: 'level_10', icon: '⭐', name: 'Niveau 10', description: 'Atteindre niveau 10' },
    { type: 'level_20', icon: '⭐⭐', name: 'Niveau 20', description: 'Atteindre niveau 20' },
    { type: 'level_50', icon: '👑', name: 'Niveau 50', description: 'Atteindre niveau 50' },
    { type: 'level_100', icon: '🌟', name: 'Niveau 100', description: 'Atteindre niveau 100' },
    { type: 'millionaire', icon: '💰', name: 'Millionnaire', description: '1000+ gemmes' },
    { type: 'streak_5', icon: '🔴', name: 'Séquence de 5', description: '5 victoires de suite' },
    { type: 'streak_10', icon: '🌶️', name: 'Séquence de 10', description: '10 victoires de suite' },
    { type: 'none_player', icon: '🤐', name: 'Maître du Nul', description: '10 parties nulles' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {allBadges.map(badge => {
        const earned = badges.find(b => b.badge_type === badge.type);
        return (
          <BadgeItem
            key={badge.type}
            icon={badge.icon}
            name={badge.name}
            description={badge.description}
            earned={!!earned}
            earnedAt={earned?.earned_at}
          />
        );
      })}
    </div>
  );
}