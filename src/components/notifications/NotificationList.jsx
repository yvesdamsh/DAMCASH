import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Trophy, UserPlus, Gamepad2, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const iconMap = {
  match_invitation: Mail,
  tournament_invitation: Trophy,
  friend_request: UserPlus,
  game_started: Gamepad2,
  game_ended: Trophy
};

export default function NotificationList({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, '-created_date'),
    enabled: !!userEmail,
    refetchInterval: 30000
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-gray-400">
              {notifications.filter(n => !n.is_read).length} non lue(s)
            </p>
          </div>
        </div>

        {notifications.some(n => !n.is_read) && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            variant="outline"
            size="sm"
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          >
            <Check className="w-4 h-4 mr-1" />
            Tout marquer
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Aucune notification</h2>
          <p className="text-gray-400">Vous n'avez pas encore de notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notification, index) => {
              const Icon = iconMap[notification.type] || Bell;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    notification.is_read
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      notification.is_read ? 'bg-white/10' : 'bg-blue-500/20'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        notification.is_read ? 'text-gray-400' : 'text-blue-400'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-semibold ${
                          notification.is_read ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(notification.created_date), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                      {notification.link && (
                        <Link to={createPageUrl(notification.link)}>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
                          >
                            Voir
                          </Button>
                        </Link>
                      )}
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}