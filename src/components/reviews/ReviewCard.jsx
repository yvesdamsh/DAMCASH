import React from 'react';
import { Star, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

const TAG_DISPLAY = {
  good_player: '⭐ Bon joueur',
  smart_moves: '🧠 Coups intelligents',
  fair_play: '🤝 Jeu loyal',
  tough_opponent: '💪 Adversaire redoutable',
  fun_game: '🎉 Partie agréable',
  fast_moves: '⚡ Coups rapides',
};

export default function ReviewCard({ review }) {
  const outcomeEmoji = {
    win: '🎉',
    loss: '😔',
    draw: '🤝'
  };

  const outcomeLabel = {
    win: 'Victoire',
    loss: 'Défaite',
    draw: 'Nul'
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-5 rounded-xl glass-card border border-[#D4A574]/20 hover:border-[#D4A574]/40 transition-all space-y-4"
    >
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-[#F5E6D3]">
              {review.reviewed_player_name}
            </h3>
            {review.is_ranked && (
              <Trophy className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <p className="text-xs text-[#D4A574]/60">
            par {review.reviewer_name}
          </p>
        </div>

        {/* Outcome badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          review.game_outcome === 'win'
            ? 'bg-green-500/20 text-green-400'
            : review.game_outcome === 'loss'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {outcomeEmoji[review.game_outcome]} {outcomeLabel[review.game_outcome]}
        </div>
      </div>

      {/* Note */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-[#D4A574]/30'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-[#D4A574]">
          {review.rating}/5
        </span>
      </div>

      {/* Commentaire */}
      {review.comment && (
        <p className="text-sm text-[#D4A574]/80 leading-relaxed italic">
          "{review.comment}"
        </p>
      )}

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.tags.map((tagId) => (
            <span
              key={tagId}
              className="inline-block px-2 py-1 rounded-full bg-[#D4A574]/10 border border-[#D4A574]/30 text-xs text-[#D4A574] font-semibold"
            >
              {TAG_DISPLAY[tagId] || tagId}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <p className="text-xs text-[#D4A574]/40 pt-2 border-t border-[#D4A574]/10">
        {format(new Date(review.created_date), 'PPp', { locale: fr })}
      </p>
    </motion.div>
  );
}