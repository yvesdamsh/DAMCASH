import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, CheckCircle, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const NOTIFICATION_ICONS = {
  game_invitation: '🎮',
  game_turn: '⏱️',
  game_result: '🏁',
  friend_request: '👋',
  tournament_notification: '🏆',
  system: '📢'
};

const NOTIFICATION_COLORS = {
  game_invitation: 'border-blue-500/30 bg-blue-900/10',
  game_turn: 'border-orange-500/30 bg-orange-900/10',
  game_result: 'border-green-500/30 bg-green-900/10',
  friend_request: 'border-purple-500/30 bg-purple-900/10',
  tournament_notification: 'border-yellow-500/30 bg-yellow-900/10',
  system: 'border-[#D4A574]/30'
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [filterTab, setFilterTab] = useState('unread');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Charger les notifications (les deux entités)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['allNotifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const [logs, notifs] = await Promise.all([
        base44.entities.NotificationLog.filter({ user_email: user.email }, '-created_date'),
        base44.entities.Notification.filter({ user_email: user.email }, '-created_date')
      ]);
      // Normaliser les deux formats en un seul
      const normalizedLogs = (logs || []).map(n => ({ ...n, _source: 'log', _read: n.read, _type: n.notification_type }));
      const normalizedNotifs = (notifs || []).map(n => ({ ...n, _source: 'notif', _read: n.is_read, _type: n.type, title: n.title, message: n.message }));
      return [...normalizedLogs, ...normalizedNotifs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email
  });

  // Subscribe aux changements
  useEffect(() => {
    const unsub1 = base44.entities.NotificationLog?.subscribe?.((event) => {
      if (event?.data?.user_email === user?.email) queryClient.invalidateQueries({ queryKey: ['allNotifications', user?.email] });
    });
    const unsub2 = base44.entities.Notification?.subscribe?.((event) => {
      if (event?.data?.user_email === user?.email) queryClient.invalidateQueries({ queryKey: ['allNotifications', user?.email] });
    });
    return () => {
      if (typeof unsub1 === 'function') unsub1();
      if (typeof unsub2 === 'function') unsub2();
    };
  }, [user?.email, queryClient]);

  const unreadNotifications = notifications.filter(n => !n._read);
  const readNotifications = notifications.filter(n => n._read);

  const handleMarkAsRead = async (notif) => {
    try {
      if (notif._source === 'log') {
        await base44.entities.NotificationLog.update(notif.id, { read: true });
      } else {
        await base44.entities.Notification.update(notif.id, { is_read: true });
      }
      queryClient.invalidateQueries({ queryKey: ['allNotifications', user?.email] });
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (notif) => {
    try {
      if (notif._source === 'log') {
        await base44.entities.NotificationLog.delete(notif.id);
      } else {
        await base44.entities.Notification.delete(notif.id);
      }
      queryClient.invalidateQueries({ queryKey: ['allNotifications', user?.email] });
      toast.success('Notification supprimée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        unreadNotifications.map(n =>
          n._source === 'log'
            ? base44.entities.NotificationLog.update(n.id, { read: true })
            : base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['allNotifications', user?.email] });
      toast.success('Toutes marquées comme lues');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const filteredNotifications = filterTab === 'unread' ? unreadNotifications : readNotifications;

  const NotificationItem = ({ notification, idx }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ x: 4 }}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        NOTIFICATION_COLORS[notification.notification_type] || NOTIFICATION_COLORS.system
      }`}
      onClick={() => {
        if (!notification._read) handleMarkAsRead(notification);
        const link = notification.action_link || notification.link;
        if (link) window.location.href = link.startsWith('http') ? link : `/${link}`;
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">
            {NOTIFICATION_ICONS[notification._type] || '📢'}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-[#F5E6D3] truncate">
                {notification.title}
              </h3>
              {!notification._read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-[#D4A574]/80 leading-relaxed">
              {notification.message}
            </p>
            <p className="text-xs text-[#D4A574]/50 mt-2">
              {formatDate(notification.created_date)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!notification._read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead(notification);
              }}
              className="p-1 hover:bg-white/10 rounded transition-all"
              title="Marquer comme lu"
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(notification);
            }}
            className="p-1 hover:bg-red-500/10 rounded transition-all"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      <style>{`
        .glass-card { background: rgba(93, 58, 26, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(212, 165, 116, 0.2); }
      `}</style>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-8 border-b border-[#D4A574]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-[#D4A574]" />
            <h1 className="text-3xl font-black">Notifications</h1>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="border-[#D4A574]/30 text-[#D4A574]"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1a0f0f] mb-8">
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Non lues ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Lues ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4A574]" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-14 h-14 text-[#D4A574]/20 mb-4" />
              <p className="text-[#D4A574]/50 text-lg">
                {filterTab === 'unread' ? 'Aucune notification' : 'Aucune notification lue'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notif, idx) => (
                  <NotificationItem key={notif.id} notification={notif} idx={idx} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}m`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  
  return d.toLocaleDateString('fr-FR');
}