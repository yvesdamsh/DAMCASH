import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, Crown, Circle, Calendar, Gem } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Tournaments() {
  const [user, setUser] = useState(null);

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

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list('-start_date')
  });

  const sampleTournaments = [
    {
      id: '1',
      name: 'Grand Prix Échecs',
      game_type: 'chess',
      status: 'upcoming',
      start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      max_participants: 64,
      participants: ['user1', 'user2', 'user3'],
      prize_gems: 500,
      time_control: 'blitz',
      image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400'
    },
    {
      id: '2',
      name: 'Coupe des Dames',
      game_type: 'checkers',
      status: 'in_progress',
      start_date: new Date().toISOString(),
      max_participants: 32,
      participants: Array(28).fill('user'),
      prize_gems: 250,
      time_control: 'rapid',
      image_url: 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=400'
    },
    {
      id: '3',
      name: 'Tournoi Bullet Express',
      game_type: 'chess',
      status: 'upcoming',
      start_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      max_participants: 128,
      participants: Array(45).fill('user'),
      prize_gems: 1000,
      time_control: 'bullet',
      image_url: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400'
    }
  ];

  const displayTournaments = tournaments.length > 0 ? tournaments : sampleTournaments;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">À venir</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">En cours</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Terminé</Badge>;
      default:
        return null;
    }
  };

  const handleJoin = async (tournamentId) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    // Join logic would go here
    alert('Inscription au tournoi réussie !');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tournois</h1>
            <p className="text-sm text-gray-400">Compétitions officielles</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all"
            >
              <div className="relative h-32">
                <img
                  src={tournament.image_url}
                  alt={tournament.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute top-3 right-3">
                  {getStatusBadge(tournament.status)}
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {tournament.game_type === 'chess' ? (
                      <Crown className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-blue-400" />
                    )}
                    <span>{tournament.game_type === 'chess' ? 'Échecs' : 'Dames'}</span>
                    <span className="text-gray-500">•</span>
                    <span className="capitalize">{tournament.time_control}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(tournament.start_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {tournament.participants?.length || 0}/{tournament.max_participants}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-amber-300">{tournament.prize_gems} gemmes</span>
                  </div>
                  
                  {tournament.status === 'upcoming' && (
                    <Button
                      onClick={() => handleJoin(tournament.id)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white"
                    >
                      S'inscrire
                    </Button>
                  )}
                  {tournament.status === 'in_progress' && (
                    <Button variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                      Regarder
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}