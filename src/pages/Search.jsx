import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search as SearchIcon, UserPlus, Trophy, Crown, Swords } from 'lucide-react';
import { toast } from 'sonner';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

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

  // Charger les utilisateurs en ligne
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const online = await base44.entities.OnlineUser.list();
        setOnlineUsers(online.map(u => u.user_id));
      } catch (error) {
        console.error('Erreur récupération online:', error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const users = await base44.entities.User.list();
      const filtered = users.filter(u => 
        u.full_name && u.full_name.toLowerCase().includes(query.toLowerCase()) &&
        u.email !== user?.email // Exclure soi-même
      );
      setResults(filtered);
    } catch (error) {
      console.error('Erreur recherche:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendEmail) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    try {
      await base44.entities.Friendship.create({
        user1: user.email,
        user2: friendEmail,
        status: 'pending'
      });
      toast.success('Demande d\'ami envoyée !');
    } catch (error) {
      console.error('Erreur ajout ami:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  const handleInviteToPlay = async (opponentEmail, opponentName) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    try {
      await base44.entities.Invitation.create({
        from_user: user.email,
        to_user: opponentEmail,
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

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nom du joueur..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
        <Button 
          onClick={handleSearch}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
        >
          Rechercher
        </Button>
      </div>

      {isSearching ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-amber-500/30">
                    <AvatarImage src={player.avatar_url} />
                    <AvatarFallback className="bg-amber-900 text-amber-200">
                      {player.full_name?.charAt(0) || 'J'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white/20 ${
                    onlineUsers.includes(player.id) ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{player.full_name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Niveau {player.level || 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      {player.chess_rating || 1200}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInviteToPlay(player.email, player.full_name)}
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                >
                  <Swords className="w-4 h-4 mr-1" />
                  Jouer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddFriend(player.email)}
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-12 text-gray-400">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun joueur trouvé</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Recherchez des joueurs par leur nom</p>
        </div>
      )}
    </div>
  );
}