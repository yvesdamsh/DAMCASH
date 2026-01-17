import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X, Crown, Circle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Invitations() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        setUser(await base44.auth.me());
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations', user?.email],
    queryFn: () => user ? base44.entities.Invitation.filter({ to_user: user.email, status: 'pending' }) : [],
    enabled: !!user
  });

  // Mock invitations for demo
  const mockInvitations = [
    {
      id: '1',
      from_user: 'champion@example.com',
      from_name: 'Le Grand Champion',
      game_type: 'chess',
      time_control: 'blitz',
      status: 'pending',
      created_date: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: '2',
      from_user: 'marie@example.com',
      from_name: 'Marie Duchesse',
      game_type: 'checkers',
      time_control: 'rapid',
      status: 'pending',
      created_date: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  const displayInvitations = invitations.length > 0 ? invitations : mockInvitations;

  const acceptMutation = useMutation({
    mutationFn: (invitationId) => base44.entities.Invitation.update(invitationId, { status: 'accepted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      alert('Invitation acceptée ! La partie va commencer.');
    }
  });

  const declineMutation = useMutation({
    mutationFn: (invitationId) => base44.entities.Invitation.update(invitationId, { status: 'declined' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    }
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Connectez-vous</h2>
          <p className="text-gray-400 mb-4">Pour voir vos invitations de parties</p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-amber-500 to-amber-600"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Invitations</h1>
          <p className="text-sm text-gray-400">{displayInvitations.length} en attente</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : displayInvitations.length > 0 ? (
        <div className="space-y-4">
          {displayInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-amber-500/30">
                    <AvatarFallback className="bg-amber-900 text-amber-200">
                      {(invitation.from_name || invitation.from_user)?.charAt(0) || 'J'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">
                      {invitation.from_name || invitation.from_user}
                    </h3>
                    <p className="text-sm text-gray-400">vous invite à jouer</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(invitation.created_date), { addSuffix: true, locale: fr })}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-white/10 text-white border-white/20">
                  {invitation.game_type === 'chess' ? (
                    <><Crown className="w-3 h-3 mr-1 text-amber-400" /> Échecs</>
                  ) : (
                    <><Circle className="w-3 h-3 mr-1 text-blue-400" /> Dames</>
                  )}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 capitalize">
                  {invitation.time_control}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => acceptMutation.mutate(invitation.id)}
                  className="flex-1 bg-green-600 hover:bg-green-500"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accepter
                </Button>
                <Button
                  onClick={() => declineMutation.mutate(invitation.id)}
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">Aucune invitation</h2>
          <p className="text-gray-400">Vous n'avez pas d'invitations en attente</p>
        </div>
      )}
    </div>
  );
}