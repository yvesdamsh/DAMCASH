import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Puzzle, Crown, Circle, Star, Lock, Check, Gem } from 'lucide-react';

export default function Puzzles() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chess');

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

  const { data: puzzles = [] } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => base44.entities.Puzzle.list()
  });

  // Mock puzzles for demo
  const mockPuzzles = {
    chess: [
      { id: '1', title: 'Mat en 2 coups', difficulty: 'easy', reward_gems: 5, completed: true },
      { id: '2', title: 'Fourchette royale', difficulty: 'easy', reward_gems: 5, completed: true },
      { id: '3', title: 'Clouage mortel', difficulty: 'medium', reward_gems: 10, completed: false },
      { id: '4', title: 'Sacrifice de dame', difficulty: 'medium', reward_gems: 10, completed: false },
      { id: '5', title: 'Mat en 4 coups', difficulty: 'hard', reward_gems: 20, completed: false, locked: true },
      { id: '6', title: 'Défense impossible', difficulty: 'hard', reward_gems: 25, completed: false, locked: true }
    ],
    checkers: [
      { id: '7', title: 'Rafle double', difficulty: 'easy', reward_gems: 5, completed: true },
      { id: '8', title: 'Promotion forcée', difficulty: 'easy', reward_gems: 5, completed: false },
      { id: '9', title: 'Piège à dame', difficulty: 'medium', reward_gems: 10, completed: false },
      { id: '10', title: 'Rafle triple', difficulty: 'hard', reward_gems: 20, completed: false, locked: true }
    ]
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  const getDifficultyStars = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  };

  const handlePlayPuzzle = (puzzle) => {
    if (puzzle.locked) {
      alert('Complétez les puzzles précédents pour débloquer celui-ci !');
      return;
    }
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    alert(`Démarrage du puzzle: ${puzzle.title}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
          <Puzzle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Puzzles</h1>
          <p className="text-sm text-gray-400">Entraînez votre esprit</p>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progression</span>
          <span className="text-amber-400 font-semibold">3/10 complétés</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 w-[30%] transition-all"></div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 mb-4">
          <TabsTrigger value="chess" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Crown className="w-4 h-4 mr-2" />
            Échecs
          </TabsTrigger>
          <TabsTrigger value="checkers" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Circle className="w-4 h-4 mr-2" />
            Dames
          </TabsTrigger>
        </TabsList>

        {Object.entries(mockPuzzles).map(([type, typePuzzles]) => (
          <TabsContent key={type} value={type}>
            <div className="space-y-3">
              {typePuzzles.map((puzzle) => (
                <div
                  key={puzzle.id}
                  className={`p-4 rounded-xl border transition-all ${
                    puzzle.locked 
                      ? 'bg-white/5 border-white/5 opacity-60' 
                      : puzzle.completed
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-white/5 border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        puzzle.locked 
                          ? 'bg-white/10' 
                          : puzzle.completed
                            ? 'bg-green-500/20'
                            : 'bg-amber-500/20'
                      }`}>
                        {puzzle.locked ? (
                          <Lock className="w-5 h-5 text-gray-500" />
                        ) : puzzle.completed ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Puzzle className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{puzzle.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getDifficultyColor(puzzle.difficulty)}>
                            {Array(getDifficultyStars(puzzle.difficulty)).fill(0).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-cyan-400">
                            <Gem className="w-3 h-3" />
                            <span>+{puzzle.reward_gems}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!puzzle.locked && !puzzle.completed && (
                      <Button
                        onClick={() => handlePlayPuzzle(puzzle)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
                      >
                        Jouer
                      </Button>
                    )}
                    {puzzle.completed && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Terminé
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}