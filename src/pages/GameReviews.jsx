import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, Filter, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewCard from '../components/reviews/ReviewCard';

const FILTER_OPTIONS = [
  { id: 'all', label: '⭐ Toutes', value: 'all' },
  { id: '5', label: '⭐⭐⭐⭐⭐ 5 étoiles', value: 5 },
  { id: '4', label: '⭐⭐⭐⭐ 4+ étoiles', value: 4 },
  { id: '3', label: '⭐⭐⭐ 3+ étoiles', value: 3 },
  { id: 'with_comment', label: '💬 Avec commentaire', value: 'with_comment' },
  { id: 'ranked', label: '🏆 Parties classées', value: 'ranked' },
];

export default function GameReviews() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Charger les revues
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['gameReviews'],
    queryFn: () => base44.entities.GameReview.list('-created_date')
  });

  // Souscrire aux changements en temps réel
  useEffect(() => {
    const unsubscribe = base44.entities.GameReview?.subscribe?.((event) => {
      if (event?.type === 'create' || event?.type === 'update') {
        queryClient.invalidateQueries({ queryKey: ['gameReviews'] });
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [queryClient]);

  // Filtrer et rechercher
  const filteredReviews = reviews.filter(review => {
    // Filtre par note
    if (selectedFilter !== 'all' && selectedFilter !== 'with_comment' && selectedFilter !== 'ranked') {
      const minRating = parseInt(selectedFilter);
      if (review.rating < minRating) return false;
    }

    // Filtre par commentaire
    if (selectedFilter === 'with_comment' && !review.comment) return false;

    // Filtre par parties classées
    if (selectedFilter === 'ranked' && !review.is_ranked) return false;

    // Recherche par nom du joueur revu
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!review.reviewed_player_name?.toLowerCase().includes(query) &&
          !review.comment?.toLowerCase().includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Statistiques
  const totalReviews = reviews.length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const reviewsWithComments = reviews.filter(r => r.comment).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      <style>{`
        .glass-card { background: rgba(93, 58, 26, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(212, 165, 116, 0.2); }
      `}</style>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 py-8 border-b border-[#D4A574]/20">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-[#D4A574]" />
          <h1 className="text-3xl font-black">Revues de parties</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl glass-card"
          >
            <p className="text-xs text-[#D4A574]/60 uppercase tracking-wider">Total revues</p>
            <p className="text-2xl font-black text-[#D4A574]">{totalReviews}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl glass-card"
          >
            <p className="text-xs text-[#D4A574]/60 uppercase tracking-wider">Note moyenne</p>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <p className="text-2xl font-black text-[#D4A574]">{avgRating}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl glass-card"
          >
            <p className="text-xs text-[#D4A574]/60 uppercase tracking-wider">Avec commentaire</p>
            <p className="text-2xl font-black text-[#D4A574]">{reviewsWithComments}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Recherche */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-3 top-3 w-4 h-4 text-[#D4A574]/50" />
          <Input
            placeholder="Rechercher par joueur, commentaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-[#D4A574]/30 text-white placeholder:text-[#D4A574]/50"
          />
        </motion.div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter, idx) => (
            <motion.button
              key={filter.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedFilter === filter.id
                  ? 'bg-[#D4A574] text-[#2C1810]'
                  : 'bg-white/5 border border-[#D4A574]/20 text-[#D4A574] hover:border-[#D4A574]/40'
              }`}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>

        {/* Revues */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4A574]" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="w-14 h-14 text-[#D4A574]/20 mb-4" />
            <p className="text-[#D4A574]/50 text-lg mb-4">Aucune revue trouvée</p>
            <p className="text-[#D4A574]/40 text-sm">Commencez à jouer et laissez des revues!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ReviewCard review={review} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}