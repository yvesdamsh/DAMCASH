import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Clock, Crown, Circle, Calendar, Gem, Zap, Flame, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function Tournaments() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

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
      participants: Array(22).fill('user'),
      prize_gems: 500,
      time_control: 'blitz',
      difficulty: 'intermediate',
      image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800'
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
      difficulty: 'advanced',
      image_url: 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=800'
    },
    {
      id: '3',
      name: 'Tournoi Bullet Express',
      game_type: 'chess',
      status: 'upcoming',
      start_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      max_participants: 128,
      participants: Array(85).fill('user'),
      prize_gems: 1000,
      time_control: 'bullet',
      difficulty: 'expert',
      image_url: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800'
    },
    {
      id: '4',
      name: 'Défi Dames Rapide',
      game_type: 'checkers',
      status: 'upcoming',
      start_date: new Date(Date.now() + 86400000 * 1).toISOString(),
      max_participants: 16,
      participants: Array(4).fill('user'),
      prize_gems: 150,
      time_control: 'blitz',
      difficulty: 'beginner',
      image_url: 'https://images.unsplash.com/photo-1566417713940-c067a354e0be?w=800'
    }
  ];

  const displayTournaments = tournaments.length > 0 ? tournaments : sampleTournaments;

  const filteredTournaments = displayTournaments.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (gameFilter !== 'all' && t.game_type !== gameFilter) return false;
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return (b.participants?.length || 0) - (a.participants?.length || 0);
      case 'price':
        return b.prize_gems - a.prize_gems;
      case 'availability':
        return (a.max_participants - (a.participants?.length || 0)) - 
               (b.max_participants - (b.participants?.length || 0));
      default:
        return new Date(a.start_date) - new Date(b.start_date);
    }
  });

  const populartournaments = [...displayTournaments].sort((a, b) => 
    (b.participants?.length || 0) - (a.participants?.length || 0)
  ).slice(0, 3);

  const myTournaments = filteredTournaments.filter(t => t.status === 'in_progress');
  const totalStats = {
    active: displayTournaments.filter(t => t.status === 'in_progress').length,
    players: displayTournaments.reduce((acc, t) => acc + (t.participants?.length || 0), 0),
    gems: displayTournaments.reduce((acc, t) => acc + t.prize_gems, 0)
  };

  const getStatusBadge = (status) => {
    if (status === 'in_progress') {
      return (
        <div className="animate-pulse bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          🔴 EN COURS
        </div>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
        {status === 'upcoming' ? '⏰ À VENIR' : '✅ TERMINÉ'}
      </Badge>
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'from-green-500 to-emerald-500';
      case 'intermediate': return 'from-yellow-500 to-orange-500';
      case 'advanced': return 'from-red-500 to-pink-500';
      case 'expert': return 'from-purple-600 to-red-600';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getTournamentImage = (gameType) => {
    return gameType === 'chess' 
      ? 'from-indigo-900 via-purple-900 to-indigo-900'
      : 'from-blue-900 via-cyan-900 to-blue-900';
  };

  const handleJoin = async (tournamentId) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 relative overflow-hidden pt-8 pb-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-6xl">🏆</div>
                <div>
                  <h1 className="text-5xl font-black text-white drop-shadow-lg">TOURNOIS</h1>
                  <p className="text-white/80 text-lg font-semibold mt-1">Compétitions officielles DamCash</p>
                </div>
              </div>
            </div>
          </div>

          {/* STATS EN TEMPS RÉEL */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/70 text-sm font-semibold">Tournois actifs</p>
              <p className="text-3xl font-black text-white mt-1">{totalStats.active}</p>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/70 text-sm font-semibold">Joueurs en lice</p>
              <p className="text-3xl font-black text-white mt-1">{totalStats.players}</p>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/70 text-sm font-semibold">Gemmes à gagner</p>
              <p className="text-3xl font-black text-white mt-1 flex items-center gap-1">
                <Gem className="w-7 h-7" />{totalStats.gems.toLocaleString()}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* TOURNOIS POPULAIRES */}
        {populartournaments.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#F5E6D3] mb-4 flex items-center gap-2">
              <Flame className="w-7 h-7 text-orange-500" /> Tournois populaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {populartournaments.map((tournament, idx) => (
                <motion.div 
                  key={tournament.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getTournamentImage(tournament.game_type)}`}></div>
                  <img src={tournament.image_url} alt={tournament.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                  
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-orange-500 text-white border-0">🔥 HOT</Badge>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white mb-2">{tournament.name}</h3>
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>{tournament.game_type === 'chess' ? '♔ Échecs' : '⚫ Dames'}</span>
                      <span className="font-bold text-amber-300">{tournament.prize_gems} 💎</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* FILTRES & ONGLETS */}
        <section className="mb-8">
          <Tabs defaultValue="all" onValueChange={setStatusFilter} className="mb-6">
            <TabsList className="bg-white/10 border border-[#D4A574]/30 p-1 flex flex-wrap h-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810]">Tous</TabsTrigger>
              <TabsTrigger value="in_progress" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">En cours</TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">À venir</TabsTrigger>
              <TabsTrigger value="finished" className="data-[state=active]:bg-gray-500 data-[state=active]:text-white">Terminés</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* FILTRES INLINE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-[#D4A574] block mb-2">JEU</label>
              <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} className="w-full bg-white/5 border border-[#D4A574]/30 rounded-lg px-3 py-2 text-sm text-[#F5E6D3]">
                <option value="all">Tous les jeux</option>
                <option value="chess">♔ Échecs</option>
                <option value="checkers">⚫ Dames</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#D4A574] block mb-2">DIFFICULTÉ</label>
              <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="w-full bg-white/5 border border-[#D4A574]/30 rounded-lg px-3 py-2 text-sm text-[#F5E6D3]">
                <option value="all">Tous les niveaux</option>
                <option value="beginner">🟢 Débutant</option>
                <option value="intermediate">🟡 Intermédiaire</option>
                <option value="advanced">🔴 Avancé</option>
                <option value="expert">🟣 Expert</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#D4A574] block mb-2">TRI</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-white/5 border border-[#D4A574]/30 rounded-lg px-3 py-2 text-sm text-[#F5E6D3]">
                <option value="date">📅 Date</option>
                <option value="popularity">👥 Popularité</option>
                <option value="price">💎 Prix</option>
                <option value="availability">📊 Places</option>
              </select>
            </div>
          </div>
        </section>

        {/* TOURNOIS */}
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-[#D4A574] text-lg font-semibold">Aucun tournoi ne correspond à vos critères</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTournaments.map((tournament) => {
              const progress = Math.round(((tournament.participants?.length || 0) / tournament.max_participants) * 100);
              return (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group rounded-2xl overflow-hidden border border-[#D4A574]/20 hover:border-[#D4A574]/60 transition-all hover:shadow-2xl hover:shadow-orange-500/20"
                >
                  <div className={`relative h-40 bg-gradient-to-br ${getTournamentImage(tournament.game_type)} overflow-hidden`}>
                    <img src={tournament.image_url} alt={tournament.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity group-hover:scale-110 duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810] to-transparent"></div>
                    
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(tournament.status)}
                    </div>
                    
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-xl font-bold text-white mb-1">{tournament.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <span>{tournament.game_type === 'chess' ? '♔ Échecs' : '⚫ Dames'}</span>
                        <span>•</span>
                        <span className="capitalize text-[#D4A574]">{tournament.time_control}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 bg-white/5 backdrop-blur">
                    {/* Récompenses */}
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-[#D4A574]/30">
                      <p className="text-xs text-[#D4A574] font-bold mb-2">RÉCOMPENSES</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-yellow-400 font-bold text-lg">🥇</p>
                          <p className="text-white text-sm font-bold">{Math.round(tournament.prize_gems * 0.6)}</p>
                        </div>
                        <div>
                          <p className="text-gray-300 font-bold text-lg">🥈</p>
                          <p className="text-white text-sm font-bold">{Math.round(tournament.prize_gems * 0.3)}</p>
                        </div>
                        <div>
                          <p className="text-orange-500 font-bold text-lg">🥉</p>
                          <p className="text-white text-sm font-bold">{Math.round(tournament.prize_gems * 0.1)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Infos */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-[#D4A574]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(tournament.start_date), 'dd MMM HH:mm', { locale: fr })}
                        </div>
                        <Badge className={`bg-gradient-to-r ${getDifficultyColor(tournament.difficulty)} text-white border-0 text-xs`}>
                          {tournament.difficulty === 'beginner' && '🟢 Débutant'}
                          {tournament.difficulty === 'intermediate' && '🟡 Intermédiaire'}
                          {tournament.difficulty === 'advanced' && '🔴 Avancé'}
                          {tournament.difficulty === 'expert' && '🟣 Expert'}
                        </Badge>
                      </div>

                      {/* Barre de progression */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 text-[#D4A574]">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold">{tournament.participants?.length || 0}/{tournament.max_participants}</span>
                          </div>
                          <span className="text-xs text-[#D4A574]">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                          ></motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Boutons */}
                    <Button 
                      onClick={() => handleJoin(tournament.id)}
                      className="w-full bg-gradient-to-r from-[#D4A574] to-orange-500 hover:from-[#E8B688] hover:to-orange-400 text-[#2C1810] font-bold py-2 flex items-center justify-center gap-2 group/btn"
                    >
                      {tournament.status === 'upcoming' ? 'S\'inscrire maintenant' : tournament.status === 'in_progress' ? 'Rejoindre' : 'Voir les résultats'}
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* MES TOURNOIS */}
        {myTournaments.length > 0 && user && (
          <section className="mt-12 pt-8 border-t border-[#D4A574]/30">
            <h2 className="text-2xl font-bold text-[#F5E6D3] mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" /> Mes tournois en cours
            </h2>
            <div className="space-y-4">
              {myTournaments.map((tournament) => (
                <motion.div 
                  key={tournament.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-white/5 border border-green-500/30 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{tournament.game_type === 'chess' ? '♔' : '⚫'}</div>
                    <div>
                      <h3 className="font-bold text-[#F5E6D3]">{tournament.name}</h3>
                      <p className="text-sm text-[#D4A574]">Position: 5e / 28</p>
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Rejoindre
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}