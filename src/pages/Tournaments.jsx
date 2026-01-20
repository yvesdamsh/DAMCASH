import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Clock, Crown, Circle, Calendar, Gem, Zap, Flame, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import CreateTournamentModal from '../components/tournament/CreateTournamentModal';

export default function Tournaments() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showCreateModal, setShowCreateModal] = useState(false);
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
        <Badge className="bg-green-600 text-white border-0 font-bold text-xs">
          EN COURS
        </Badge>
      );
    }
    return (
      <Badge className={`${status === 'upcoming' ? 'bg-blue-600' : 'bg-gray-600'} text-white border-0 font-bold text-xs`}>
        {status === 'upcoming' ? 'À VENIR' : 'TERMINÉ'}
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

  const handleTournamentCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['tournaments'] });
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
      <CreateTournamentModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        onSuccess={handleTournamentCreated}
        user={user}
      />
      {/* HEADER PROFESSIONNEL */}
      <div className="relative overflow-hidden pt-8 pb-12 bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border-b-2 border-[#D4A574]/30">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #D4A574 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="border-l-4 border-[#D4A574] pl-6">
                <h1 className="text-4xl md:text-5xl font-bold text-[#F5E6D3] mb-2">Tournois</h1>
                <p className="text-[#D4A574] text-lg">Compétitions officielles et qualifiantes</p>
              </div>
            </div>
            <motion.button 
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] hover:shadow-lg hover:shadow-[#D4A574]/30 text-[#2C1810] font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              Créer un tournoi
            </motion.button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 rounded-lg p-4">
              <p className="text-[#D4A574] text-sm uppercase tracking-wider mb-2">Tournois actifs</p>
              <p className="text-3xl font-bold text-[#F5E6D3]">{totalStats.active}</p>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 rounded-lg p-4">
              <p className="text-[#D4A574] text-sm uppercase tracking-wider mb-2">Participants</p>
              <p className="text-3xl font-bold text-[#F5E6D3]">{totalStats.players}</p>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 rounded-lg p-4">
              <p className="text-[#D4A574] text-sm uppercase tracking-wider mb-2">Prix total</p>
              <p className="text-3xl font-bold text-[#F5E6D3] flex items-center gap-2">
                <Gem className="w-6 h-6 text-[#D4A574]" />{totalStats.gems.toLocaleString()}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* TOURNOIS POPULAIRES */}
        {populartournaments.length > 0 && (
          <section className="mb-12">
            <div className="border-l-4 border-[#D4A574] pl-6 mb-6">
              <h2 className="text-3xl font-bold text-[#F5E6D3] mb-2">Tournois populaires</h2>
              <p className="text-[#D4A574]">Les compétitions les plus suivies</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {populartournaments.map((tournament, idx) => (
                <motion.div 
                  key={tournament.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative rounded-lg overflow-hidden cursor-pointer border border-[#D4A574]/30 hover:border-[#D4A574]/60 transition-all"
                >
                  <div className="relative h-48">
                    <img src={tournament.image_url} alt={tournament.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810] via-[#2C1810]/50 to-transparent"></div>
                  </div>
                  
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-[#D4A574] text-[#2C1810] border-0 font-bold">POPULAIRE</Badge>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-[#F5E6D3] mb-2">{tournament.name}</h3>
                    <div className="flex items-center justify-between text-sm text-[#D4A574]">
                      <span>{tournament.game_type === 'chess' ? 'Échecs' : 'Dames'}</span>
                      <span className="font-bold text-[#F5E6D3] flex items-center gap-1">
                        <Gem className="w-4 h-4" />{tournament.prize_gems}
                      </span>
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
            <TabsList className="bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810] text-[#F5E6D3]">Tous</TabsTrigger>
              <TabsTrigger value="in_progress" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810] text-[#F5E6D3]">En cours</TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810] text-[#F5E6D3]">À venir</TabsTrigger>
              <TabsTrigger value="finished" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-[#2C1810] text-[#F5E6D3]">Terminés</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* FILTRES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-[#D4A574] block mb-2 uppercase tracking-wider">Discipline</label>
              <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} className="w-full bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-sm text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]">
                <option value="all">Toutes</option>
                <option value="chess">Échecs</option>
                <option value="checkers">Dames</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#D4A574] block mb-2 uppercase tracking-wider">Niveau</label>
              <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="w-full bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-sm text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]">
                <option value="all">Tous</option>
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#D4A574] block mb-2 uppercase tracking-wider">Trier par</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-sm text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]">
                <option value="date">Date</option>
                <option value="popularity">Popularité</option>
                <option value="price">Prix</option>
                <option value="availability">Places disponibles</option>
              </select>
            </div>
          </div>
        </section>

        {/* TOURNOIS */}
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-16 border border-[#D4A574]/30 rounded-lg bg-gradient-to-br from-[#2C1810] to-[#5D3A1A]">
            <Trophy className="w-16 h-16 text-[#D4A574] mx-auto mb-4" />
            <p className="text-[#D4A574] text-lg">Aucun tournoi ne correspond à vos critères</p>
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
                  className="group rounded-lg overflow-hidden border border-[#D4A574]/30 hover:border-[#D4A574]/60 transition-all hover:shadow-lg hover:shadow-[#D4A574]/20 bg-gradient-to-br from-[#2C1810] to-[#5D3A1A]"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={tournament.image_url} alt={tournament.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity group-hover:scale-105 duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810] via-[#2C1810]/50 to-transparent"></div>
                    
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(tournament.status)}
                    </div>
                    
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-[#F5E6D3] mb-1">{tournament.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-[#D4A574]">
                        <span>{tournament.game_type === 'chess' ? 'Échecs' : 'Dames'}</span>
                        <span>•</span>
                        <span className="capitalize">{tournament.time_control}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Récompenses */}
                    <div className="bg-[#D4A574]/10 rounded-lg p-3 border border-[#D4A574]/30">
                      <p className="text-xs text-[#D4A574] font-bold mb-2 uppercase tracking-wider">Dotation</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <Trophy className="w-5 h-5 text-[#D4A574] mx-auto mb-1" />
                          <p className="text-[#F5E6D3] text-sm font-bold">{Math.round(tournament.prize_gems * 0.6)}</p>
                        </div>
                        <div>
                          <Trophy className="w-5 h-5 text-[#8B5A2B] mx-auto mb-1" />
                          <p className="text-[#F5E6D3] text-sm font-bold">{Math.round(tournament.prize_gems * 0.3)}</p>
                        </div>
                        <div>
                          <Trophy className="w-5 h-5 text-[#5D3A1A] mx-auto mb-1" />
                          <p className="text-[#F5E6D3] text-sm font-bold">{Math.round(tournament.prize_gems * 0.1)}</p>
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
                        <Badge className="bg-[#8B5A2B] text-[#F5E6D3] border-0 text-xs font-bold">
                          {tournament.difficulty === 'beginner' && 'Débutant'}
                          {tournament.difficulty === 'intermediate' && 'Intermédiaire'}
                          {tournament.difficulty === 'advanced' && 'Avancé'}
                          {tournament.difficulty === 'expert' && 'Expert'}
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
                        <div className="w-full h-2 bg-[#1a0f0f] rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B]"
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
                      className="w-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] hover:shadow-lg hover:shadow-[#D4A574]/30 text-[#2C1810] font-bold py-2 rounded-lg flex items-center justify-center gap-2 group/btn"
                    >
                      {tournament.status === 'upcoming' ? 'S\'inscrire' : tournament.status === 'in_progress' ? 'Rejoindre' : 'Résultats'}
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
            <div className="border-l-4 border-[#D4A574] pl-6 mb-6">
              <h2 className="text-2xl font-bold text-[#F5E6D3] mb-2">Mes tournois en cours</h2>
              <p className="text-[#D4A574]">Compétitions auxquelles vous participez</p>
            </div>
            <div className="space-y-4">
              {myTournaments.map((tournament) => (
                <motion.div 
                  key={tournament.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 rounded-lg p-4 flex items-center justify-between hover:border-[#D4A574]/60 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Trophy className="w-8 h-8 text-[#D4A574]" />
                    <div>
                      <h3 className="font-bold text-[#F5E6D3]">{tournament.name}</h3>
                      <p className="text-sm text-[#D4A574]">Position: 5e / 28</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] hover:shadow-lg hover:shadow-[#D4A574]/30 text-[#2C1810] font-bold rounded-lg">
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