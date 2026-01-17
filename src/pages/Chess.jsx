import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import GameSetup from '../components/game/GameSetup';
import ChessBoard from '../components/game/ChessBoard';

export default function Chess() {
  const [gameStarted, setGameStarted] = useState(false);
  const [settings, setSettings] = useState({
    mode: 'ai',
    timeControl: 'blitz',
    color: 'white',
    aiLevel: 'medium'
  });

  const handleStart = () => {
    if (settings.color === 'random') {
      setSettings(prev => ({
        ...prev,
        color: Math.random() > 0.5 ? 'white' : 'black'
      }));
    }
    setGameStarted(true);
  };

  const handleBack = () => {
    setGameStarted(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl(gameStarted ? 'Chess' : 'Play')}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-white"
            onClick={gameStarted ? handleBack : undefined}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Échecs</h1>
            <p className="text-xs text-gray-400">
              {gameStarted 
                ? `${settings.mode === 'ai' ? 'vs IA' : 'En ligne'} • ${settings.timeControl}`
                : 'Configuration de la partie'
              }
            </p>
          </div>
        </div>
      </div>

      {!gameStarted ? (
        <GameSetup 
          gameType="chess"
          settings={settings}
          setSettings={setSettings}
          onStart={handleStart}
        />
      ) : (
        <ChessBoard 
          playerColor={settings.color}
          aiLevel={settings.aiLevel}
        />
      )}
    </div>
  );
}