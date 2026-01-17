import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBadge({ userEmail }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userEmail) return;

    const loadUnreadCount = async () => {
      try {
        const notifications = await base44.entities.Notification.filter({
          user_email: userEmail,
          is_read: false
        });
        setUnreadCount(notifications.length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  if (unreadCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1a0f0f]"
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
}