import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserMinus, Gamepad2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import InviteToGameModal from './InviteToGameModal';

export default function FriendCard({ friend, isOnline, onRemove }) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="p-4 rounded-xl glass-card border border-[#D4A574]/20 hover:border-[#D4A574]/40 transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5A2B] flex items-center justify-center font-bold text-[#2C1810]">
                {friend.friendEmail?.charAt(0).toUpperCase() || 'U'}
              </div>
              {/* Statut en ligne */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#2C1810] ${
                isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#F5E6D3] truncate">
                {friend.friendEmail?.split('@')[0] || 'Ami'}
              </p>
              <p className="text-xs text-[#D4A574]/60">
                {isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
              </p>
            </div>
          </div>

          {/* Menu */}
          <button
            onClick={onRemove}
            className="p-1 text-[#D4A574]/40 hover:text-red-400 transition-colors"
            title="Supprimer"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowInviteModal(true)}
            disabled={!isOnline}
            size="sm"
            className="flex-1 bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/40 text-xs h-8"
          >
            <Gamepad2 className="w-3 h-3 mr-1" />
            Inviter
          </Button>
        </div>
      </motion.div>

      <InviteToGameModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        friendEmail={friend.friendEmail}
        friendName={friend.friendEmail?.split('@')[0]}
      />
    </>
  );
}