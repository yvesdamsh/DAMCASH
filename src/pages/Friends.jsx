import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Check, X, Swords, Crown, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Friends() {
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

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships', user?.email],
    queryFn: () => user ? base44.entities.Friendship.list() : [],
    enabled: !!user
  });

  // Mock friends for demo
  const mockFriends = [
    { id: '1', email: 'alex@example.com', full_name: 'Alexandre Dupont', level: 15, is_online: true, chess_rating: 1450 },
    { id: '2', email: 'marie@example.com', full_name: 'Marie Martin', level: 22, is_online: true, chess_rating: 1680 },
    { id: '3', email: 'pierre@example.com', full_name: 'Pierre Bernard', level: 8, is_online: false, chess_rating: 1200 }
  ];

  const mockRequests = [
    { id: '1', user1: 'new@example.com', from_name: 'Nouveau Joueur', level: 5, status: 'pending' }
  ];

  const acceptMutation = useMutation({
    mutationFn: (friendshipId) => base44.entities.Friendship.update(friendshipId, { status: 'accepted' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friendships'] })
  });

  const declineMutation = useMutation({
    mutationFn: (friendshipId) => base44.entities.Friendship.delete(friendshipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friendships'] })
  });

  const handleInvite = async (friendEmail, gameType) => {
    if (!user) return;
    
    try {
      await base44.entities.Invitation.create({
        from_user: user.email,
        to_user: friendEmail,
        game_type: gameType,
        time_control: 'blitz',
        status: 'pending'
      });
      alert('Invitation envoyée !');
    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">Connectez-vous</h2>
        <p className="text-gray-400 mb-4">Pour voir vos amis</p>
        <Button 
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-amber-500 to-amber-600"
        >
          Se connecter
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Amis</h1>
            <p className="text-sm text-gray-400">{mockFriends.filter(f => f.is_online).length} en ligne</p>
          </div>
        </div>
        
        <Link to={createPageUrl('Search')}>
          <Button className="bg-gradient-to-r from-amber-500 to-amber-600">
            <UserPlus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="friends">
        <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 mb-4">
          <TabsTrigger value="friends" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            Amis ({mockFriends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            Demandes ({mockRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <div className="space-y-3">
            {mockFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-amber-500/30">
                      <AvatarFallback className="bg-amber-900 text-amber-200">
                        {friend.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {friend.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a0f0f]"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{friend.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>Niveau {friend.level}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        {friend.chess_rating}
                      </span>
                    </div>
                  </div>
                </div>

                {friend.is_online && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleInvite(friend.email, 'chess')}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"
                    >
                      <Crown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(friend.email, 'checkers')}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                    >
                      <Circle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-3">
            {mockRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-amber-500/30">
                    <AvatarFallback className="bg-amber-900 text-amber-200">
                      {request.from_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">{request.from_name}</h3>
                    <p className="text-sm text-gray-400">Niveau {request.level}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate(request.id)}
                    className="bg-green-600 hover:bg-green-500"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => declineMutation.mutate(request.id)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}