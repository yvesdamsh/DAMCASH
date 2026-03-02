import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FriendRequestCard({ request, onAccept, onDecline }) {
  const senderName = request.sender_id?.split('@')[0] || 'Utilisateur';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl glass-card border border-blue-500/30 hover:border-blue-500/50 transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-600/50 flex items-center justify-center font-bold text-blue-300">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#F5E6D3] truncate">
              {senderName}
            </p>
            <p className="text-xs text-blue-400">Demande d'ami en attente</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onAccept}
            size="sm"
            className="bg-green-600/50 hover:bg-green-600 text-white text-xs h-8 px-3"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepter
          </Button>
          <Button
            onClick={onDecline}
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}