import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Zap, Swords, Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdvancedStatistics() {
  const [user, setUser] = useState(null);
  const [comparisonPlayer, setComparisonPlayer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Charger l'historique du classement
  const { data: ratingHistory = [] } = useQuery({
    queryKey: ['ratingHistory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await base44.entities.ELORating.filter(
        { user_id: user.id },
        'timestamp',
        100
      );
      return results;
    },
    enabled: !!user?.id
  });

  // Charger les stats d'ouvertures
  const { data: openingStats = [] } = useQuery({
    queryKey: ['openingStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = await base44.entities.ChessOpeningStats.filter({
        user_id: user.id
      });
      return results;
    },
    enabled: !!user?.id
  });

  // Charger les joueurs pour comparaison
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const results = await base44.entities.PlayerStats.list('-chess_wins', 50);
      return results;
    }
  });

  const handleComparePlayer = async (playerId) => {
    const player = allPlayers.find(p => p.user_id === playerId);
    if (player) {
      setComparisonPlayer(player);
      setSearchQuery('');
      toast.success(`Comparaison avec ${player.username}`);
    }
  };

  // Préparer les données pour les graphiques
  const ratingData = ratingHistory.map(r => ({
    date: new Date(r.timestamp).toLocaleDateString('fr-FR'),
    rating: r.rating_after,
    opponent: r.opponent_rating
  }));

  const openingDataWhite = openingStats.filter(o => o.color === 'white');
  const openingDataBlack = openingStats.filter(o => o.color === 'black');

  // Stats pièces (simulation)
  const pieceStats = [
    { piece: '♔ Roi', contribution: 85, accuracy: 92 },
    { piece: '♕ Dame', contribution: 78, accuracy: 88 },
    { piece: '♖ Tour', contribution: 82, accuracy: 85 },
    { piece: '♗ Fou', contribution: 70, accuracy: 80 },
    { piece: '♘ Cavalier', contribution: 65, accuracy: 75 },
    { piece: '♙ Pion', contribution: 60, accuracy: 70 }
  ];

  const filteredPlayers = comparisonPlayer
    ? [comparisonPlayer]
    : allPlayers.filter(p => 
        p.username?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      <style>{`
        .glass-card { background: rgba(93, 58, 26, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(212, 165, 116, 0.2); }
        .recharts-wrapper { outline: none !important; }
        .recharts-text { fill: #D4A574 !important; }
        .recharts-cartesian-axis-tick-value { fill: #D4A574 !important; }
        .recharts-legend-wrapper { padding-top: 20px !important; }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b border-[#D4A574]/20">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-[#D4A574]" />
          <h1 className="text-3xl font-black">Statistiques avancées</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="rating" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-[#1a0f0f] mb-8">
            <TabsTrigger value="rating">Classement</TabsTrigger>
            <TabsTrigger value="openings">Ouvertures</TabsTrigger>
            <TabsTrigger value="pieces">Pièces</TabsTrigger>
            <TabsTrigger value="comparison">Comparaison</TabsTrigger>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
          </TabsList>

          {/* TAB: Évolution du classement */}
          <TabsContent value="rating" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl glass-card"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D4A574]" />
                Évolution du classement (Échecs)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 165, 116, 0.1)" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ background: '#2C1810', border: '1px solid #D4A574', borderRadius: '8px' }}
                    formatter={(value) => [value, 'Rating']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#D4A574" 
                    name="Votre Rating" 
                    strokeWidth={2}
                    dot={{ fill: '#D4A574', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="opponent" 
                    stroke="#8B5A2B" 
                    name="Rating adversaire (moy)" 
                    strokeWidth={1}
                    opacity={0.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Stats clés */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Plus haute cote', value: '1850', change: '+15' },
                { label: 'Cote actuelle', value: '1720', change: '-5' },
                { label: 'Plus basse cote', value: '1600', change: '0' }
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-xl glass-card"
                >
                  <p className="text-xs uppercase tracking-widest text-[#D4A574]/60 mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-[#D4A574]">{stat.value}</p>
                  <p className={`text-xs mt-2 ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change} cette semaine
                  </p>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* TAB: Ouvertures */}
          <TabsContent value="openings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ouvertures en Blanc */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-xl glass-card"
              >
                <h3 className="text-lg font-bold mb-4">♙ Ouvertures en Blanc</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {openingDataWhite.slice(0, 10).map((opening, idx) => (
                    <motion.div
                      key={opening.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 bg-white/5 rounded-lg border border-[#D4A574]/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm">{opening.opening_name}</p>
                          <p className="text-xs text-[#D4A574]/60">{opening.opening_eco}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#D4A574]">{opening.win_rate?.toFixed(1)}%</p>
                          <p className="text-xs text-[#D4A574]/60">{opening.games_played} parties</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${opening.win_rate || 0}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Ouvertures en Noir */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-xl glass-card"
              >
                <h3 className="text-lg font-bold mb-4">♟ Ouvertures en Noir</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {openingDataBlack.slice(0, 10).map((opening, idx) => (
                    <motion.div
                      key={opening.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 bg-white/5 rounded-lg border border-[#D4A574]/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm">{opening.opening_name}</p>
                          <p className="text-xs text-[#D4A574]/60">{opening.opening_eco}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#D4A574]">{opening.win_rate?.toFixed(1)}%</p>
                          <p className="text-xs text-[#D4A574]/60">{opening.games_played} parties</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${opening.win_rate || 0}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* TAB: Statistiques par pièce */}
          <TabsContent value="pieces" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl glass-card"
            >
              <h3 className="text-lg font-bold mb-4">📊 Performance par pièce</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={pieceStats}>
                  <PolarGrid stroke="rgba(212, 165, 116, 0.2)" />
                  <PolarAngleAxis dataKey="piece" stroke="#D4A574" />
                  <PolarRadiusAxis stroke="#D4A574" />
                  <Radar 
                    name="Contribution" 
                    dataKey="contribution" 
                    stroke="#D4A574" 
                    fill="#D4A574" 
                    fillOpacity={0.6}
                  />
                  <Radar 
                    name="Précision" 
                    dataKey="accuracy" 
                    stroke="#8B5A2B" 
                    fill="#8B5A2B" 
                    fillOpacity={0.4}
                  />
                  <Legend />
                  <Tooltip contentStyle={{ background: '#2C1810', border: '1px solid #D4A574' }} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Détails par pièce */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pieceStats.map((stat, idx) => (
                <motion.div
                  key={stat.piece}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl glass-card"
                >
                  <p className="text-lg font-bold mb-2">{stat.piece}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-[#D4A574]/60">Contribution</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#D4A574] rounded-full"
                            style={{ width: `${stat.contribution}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#D4A574]">{stat.contribution}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#D4A574]/60">Précision</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-400">{stat.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* TAB: Comparaison */}
          <TabsContent value="comparison" className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Rechercher un joueur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-[#D4A574]/30"
                />
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#2C1810] border border-[#D4A574]/30 rounded-lg z-10 max-h-48 overflow-y-auto">
                    {filteredPlayers.map(player => (
                      <button
                        key={player.user_id}
                        onClick={() => handleComparePlayer(player.user_id)}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 border-b border-[#D4A574]/10 last:border-b-0"
                      >
                        <p className="font-semibold">{player.username}</p>
                        <p className="text-xs text-[#D4A574]/60">Cote: {player.chess_wins || 1200}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {comparisonPlayer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl glass-card"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">Vs {comparisonPlayer.username}</h3>
                    <Button
                      onClick={() => {
                        setComparisonPlayer(null);
                        setSearchQuery('');
                      }}
                      variant="outline"
                      className="border-[#D4A574]/30"
                    >
                      Changer
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Victoires', you: 12, them: 8 },
                      { label: 'Défaites', you: 5, them: 9 },
                      { label: 'Nuls', you: 3, them: 3 }
                    ].map(stat => (
                      <div key={stat.label} className="p-4 bg-white/5 rounded-lg">
                        <p className="text-xs uppercase tracking-widest text-[#D4A574]/60 mb-3">{stat.label}</p>
                        <div className="flex items-end justify-between gap-2">
                          <div className="flex-1">
                            <div className="h-16 bg-green-500/30 rounded flex items-end justify-center">
                              <div className="text-2xl font-black text-green-400">{stat.you}</div>
                            </div>
                            <p className="text-xs text-[#D4A574]/60 mt-2 text-center">Vous</p>
                          </div>
                          <div className="flex-1">
                            <div className="h-12 bg-red-500/30 rounded flex items-end justify-center">
                              <div className="text-2xl font-black text-red-400">{stat.them}</div>
                            </div>
                            <p className="text-xs text-[#D4A574]/60 mt-2 text-center">Eux</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { cat: 'Cote', you: user?.chess_rating || 1200, them: comparisonPlayer.chess_wins || 1200 },
                      { cat: 'Parties', you: 30, them: 45 },
                      { cat: 'Victoires', you: 20, them: 28 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 165, 116, 0.1)" />
                      <XAxis dataKey="cat" />
                      <YAxis />
                      <Tooltip contentStyle={{ background: '#2C1810', border: '1px solid #D4A574' }} />
                      <Legend />
                      <Bar dataKey="you" fill="#D4A574" name="Vous" />
                      <Bar dataKey="them" fill="#8B5A2B" name={comparisonPlayer.username} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* TAB: Analyse détaillée */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-xl glass-card space-y-4"
              >
                <h3 className="text-lg font-bold">🎯 Sujets d'amélioration</h3>
                <div className="space-y-3">
                  {[
                    { area: 'Fin de partie', weakness: 'Moyen' },
                    { area: 'Milieu de partie', weakness: 'Faible' },
                    { area: 'Défense', weakness: 'Moyen' },
                    { area: 'Attaque', weakness: 'Fort' }
                  ].map(item => (
                    <div key={item.area} className="p-3 bg-white/5 rounded-lg">
                      <p className="font-semibold text-sm mb-2">{item.area}</p>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          item.weakness === 'Faible' ? 'bg-red-500/20 text-red-400' :
                          item.weakness === 'Moyen' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {item.weakness}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-xl glass-card space-y-4"
              >
                <h3 className="text-lg font-bold">📈 Tendances</h3>
                <div className="space-y-3">
                  {[
                    { metric: 'Cote (30j)', trend: '+45', direction: '📈' },
                    { metric: 'Taux victoire', trend: '+5%', direction: '📈' },
                    { metric: 'Temps moyen', trend: '+2min', direction: '⏱️' },
                    { metric: 'Cohérence', trend: '+8%', direction: '📈' }
                  ].map(item => (
                    <div key={item.metric} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="font-semibold text-sm">{item.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.direction}</span>
                        <span className="text-[#D4A574] font-bold">{item.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}