import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const REVIEW_TAGS = [
  { id: 'good_player', label: '⭐ Bon joueur', emoji: '⭐' },
  { id: 'smart_moves', label: '🧠 Coups intelligents', emoji: '🧠' },
  { id: 'fair_play', label: '🤝 Jeu loyal', emoji: '🤝' },
  { id: 'tough_opponent', label: '💪 Adversaire redoutable', emoji: '💪' },
  { id: 'fun_game', label: '🎉 Partie agréable', emoji: '🎉' },
  { id: 'fast_moves', label: '⚡ Coups rapides', emoji: '⚡' },
];

export default function GameReviewModal({ open, onOpenChange, gameResult, currentUserId, currentUserName }) {
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (!rating) {
      toast.error('Veuillez donner une note');
      return;
    }

    setLoading(true);
    try {
      // Déterminer qui on revoit (l'adversaire)
      const reviewedPlayerId = currentUserId === gameResult.player1_id 
        ? gameResult.player2_id 
        : gameResult.player1_id;
      
      const reviewedPlayerName = currentUserId === gameResult.player1_id
        ? gameResult.player2_name
        : gameResult.player1_name;

      // Déterminer l'issue pour le relecteur
      let gameOutcome = 'draw';
      if (gameResult.result === 'white') {
        gameOutcome = currentUserId === gameResult.player1_id ? 'win' : 'loss';
      } else if (gameResult.result === 'black') {
        gameOutcome = currentUserId === gameResult.player2_id ? 'win' : 'loss';
      }

      await base44.entities.GameReview.create({
        game_result_id: gameResult.id,
        game_type: gameResult.game_type,
        reviewer_id: currentUserId,
        reviewer_name: currentUserName,
        reviewed_player_id: reviewedPlayerId,
        reviewed_player_name: reviewedPlayerName,
        rating,
        comment: comment.trim(),
        game_outcome: gameOutcome,
        is_ranked: !!gameResult.is_ranked,
        tags: selectedTags
      });

      toast.success('Revue publiée!');
      onOpenChange(false);
      setComment('');
      setRating(3);
      setSelectedTags([]);
    } catch (error) {
      console.error(error);
      toast.error('Erreur publication revue');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const reviewedPlayerName = currentUserId === gameResult?.player1_id 
    ? gameResult?.player2_name 
    : gameResult?.player1_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C1810] border-[#D4A574]/50 text-[#F5E6D3] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Évaluer la partie contre {reviewedPlayerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Note en étoiles */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Note</Label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRating(star)}
                  className={`transition-all ${rating >= star ? 'text-yellow-400' : 'text-[#D4A574]/30'}`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </motion.button>
              ))}
              <span className="ml-3 text-sm text-[#D4A574]/70">
                {rating === 1 && 'Très mauvais'}
                {rating === 2 && 'Mauvais'}
                {rating === 3 && 'Moyen'}
                {rating === 4 && 'Bon'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Caractéristiques (optionnel)</Label>
            <div className="grid grid-cols-2 gap-3">
              {REVIEW_TAGS.map((tag) => (
                <motion.label
                  key={tag.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 p-3 rounded-lg border border-[#D4A574]/20 hover:border-[#D4A574]/40 cursor-pointer transition-all"
                >
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                    className="border-[#D4A574]/50"
                  />
                  <span className="text-sm">{tag.label}</span>
                </motion.label>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Commentaire (optionnel)</Label>
            <Textarea
              placeholder="Partagez vos impressions sur cette partie, le style de jeu, les moments clés..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              className="bg-white/5 border-[#D4A574]/30 text-white placeholder:text-[#D4A574]/50 resize-none"
              rows={5}
            />
            <p className="text-xs text-[#D4A574]/50 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-[#D4A574]/30"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitReview}
              className="bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] text-[#2C1810] hover:opacity-90 font-bold"
              disabled={loading}
            >
              {loading ? 'Publication...' : '✓ Publier la revue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}