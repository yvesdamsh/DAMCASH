import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search as SearchIcon, UserPlus, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadAllPlayers();
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

  const loadAllPlayers = async () => {
    try {
      const allPlayers = await base44.entities.OnlineUser.list();
      setResults(allPlayers);
    } catch (error) {
      console.error('Erreur chargement joueurs:', error);
      setResults([]);
    }
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setQuery(searchValue);
    
    if (!searchValue.trim()) {
      loadAllPlayers();
      return;
    }

    const filtered = results.filter(u =>
      u.username.toLowerCase().includes(searchValue.toLowerCase())
    );
    setResults(filtered);
  };

  const handleAddFriend = async (opponentId) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    try {
      toast.success('Ami ajouté !');
    } catch (error) {
      console.error('Erreur ajout ami:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleInviteToPlay = async (opponentId, opponentName) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    try {
      await base44.entities.Invitation.create({
        from_user: user.email,
        to_user: opponentId,
        game_type: 'chess',
        time_control: 'blitz',
        status: 'pending'
      });
      toast.success(`Invitation envoyée à ${opponentName} !`);
    } catch (error) {
      console.error('Erreur invitation:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Rechercher des joueurs</h1>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={query}
          onChange={handleSearch}
          placeholder="Nom du joueur..."
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-10 h-10 bg-amber-900 text-amber-200">
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{player.username}</h3>
                  <Badge className="bg-green-500 text-white">En ligne</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInviteToPlay(player.user_id, player.username)}
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                >
                  Inviter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddFriend(player.user_id)}
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun joueur trouvé</p>
        </div>
      )}
    </div>
  );
}