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
    // Badges de jeu
    { type: 'first_blood', icon: '🆕', name: 'Premier Sang', description: '1ère victoire', category: 'Jeu' },
    { type: 'on_fire', icon: '🔥', name: 'En Feu', description: '5 victoires consécutives', category: 'Jeu' },
    { type: 'streak_5', icon: '🔴', name: 'Séquence de 5', description: '5 victoires de suite', category: 'Jeu' },
    { type: 'streak_10', icon: '🌶️', name: 'Séquence de 10', description: '10 victoires de suite', category: 'Jeu' },
    { type: 'none_player', icon: '🤐', name: 'Maître du Nul', description: '10 parties nulles', category: 'Jeu' },
    // Badges de niveau
    { type: 'level_10', icon: '⭐', name: 'Niveau 10', description: 'Atteindre niveau 10', category: 'Niveau' },
    { type: 'level_20', icon: '⭐⭐', name: 'Niveau 20', description: 'Atteindre niveau 20', category: 'Niveau' },
    { type: 'level_50', icon: '👑', name: 'Niveau 50', description: 'Atteindre niveau 50', category: 'Niveau' },
    { type: 'level_100', icon: '🌟', name: 'Niveau 100', description: 'Atteindre niveau 100', category: 'Niveau' },
    // Badges de tournoi
    { type: 'tournament_participant', icon: '🎫', name: 'Compétiteur', description: 'Participer à un tournoi', category: 'Tournoi' },
    { type: 'tournament_winner', icon: '🏆', name: 'Champion', description: 'Remporter un tournoi', category: 'Tournoi' },
    { type: 'arena_daily_winner', icon: '⚡', name: 'Champion Arena Daily', description: 'Remporter une Arena Daily', category: 'Tournoi' },
    { type: 'arena_weekly_winner', icon: '🔥', name: 'Champion Arena Weekly', description: 'Remporter une Arena Weekly', category: 'Tournoi' },
    { type: 'arena_monthly_winner', icon: '👑', name: 'Champion du Mois', description: 'Remporter une Arena Monthly', category: 'Tournoi' },
    { type: 'arena_annual_winner', icon: '🏅', name: 'Champion Annuel', description: 'Remporter une Arena Annual', category: 'Tournoi' },
    { type: 'cup_winner', icon: '🛡', name: 'Vainqueur de Coupe', description: 'Remporter une Coupe', category: 'Tournoi' },
    { type: 'tournament_top3', icon: '🥉', name: 'Podium', description: 'Top 3 dans un tournoi', category: 'Tournoi' },
    { type: 'millionaire', icon: '🪙', name: 'Richissime', description: '1000+ jetons', category: 'Économie' },
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