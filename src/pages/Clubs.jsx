import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building, Users, Plus, Crown, Search } from 'lucide-react';

export default function Clubs() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newClubName, setNewClubName] = useState('');

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

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => base44.entities.Club.list()
  });

  // Mock clubs for demo
  const mockClubs = [
    { id: '1', name: 'Les Maîtres du Plateau', description: 'Club pour les passionnés de stratégie', members: ['user1', 'user2', 'user3', 'user4', 'user5'], owner: 'master@example.com', image_url: '🏆' },
    { id: '2', name: 'Échecs Club Paris', description: 'Rejoignez les joueurs parisiens', members: ['user1', 'user2', 'user3'], owner: 'paris@example.com', image_url: '🗼' },
    { id: '3', name: 'Dames Royales', description: 'Spécialisé dans les dames internationales', members: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7'], owner: 'royal@example.com', image_url: '👑' }
  ];

  const displayClubs = clubs.length > 0 ? clubs : mockClubs;

  const filteredClubs = displayClubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinClub = async (clubId) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    alert('Vous avez rejoint le club !');
  };

  const handleCreateClub = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    if (!newClubName.trim()) return;

    try {
      await base44.entities.Club.create({
        name: newClubName,
        owner: user.email,
        members: [user.email],
        is_public: true
      });
      alert('Club créé avec succès !');
      setNewClubName('');
    } catch (error) {
      console.error('Error creating club:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Clubs</h1>
            <p className="text-sm text-gray-400">Rejoignez une communauté</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600">
              <Plus className="w-4 h-4 mr-1" />
              Créer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2d1515] border-amber-900/50 text-white">
            <DialogHeader>
              <DialogTitle>Créer un club</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                placeholder="Nom du club..."
                className="bg-white/5 border-white/10 text-white"
              />
              <Button 
                onClick={handleCreateClub}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600"
              >
                Créer le club
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un club..."
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Clubs List */}
      <div className="space-y-4">
        {filteredClubs.map((club) => (
          <div
            key={club.id}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center text-2xl">
                  {club.image_url}
                </div>
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    {club.name}
                    {club.owner === user?.email && (
                      <Crown className="w-4 h-4 text-amber-400" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">{club.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{club.members?.length || 0} membres</span>
                  </div>
                </div>
              </div>

              {!club.members?.includes(user?.email) && (
                <Button
                  onClick={() => handleJoinClub(club.id)}
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                >
                  Rejoindre
                </Button>
              )}
              {club.members?.includes(user?.email) && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Membre
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}