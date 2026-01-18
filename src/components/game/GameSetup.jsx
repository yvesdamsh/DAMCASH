import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Globe, Clock, Zap, Timer, Hourglass, Infinity, Shuffle } from 'lucide-react';

export default function GameSetup({ gameType, settings, setSettings, onStart }) {
  const modes = [
    { id: 'ai', label: 'vs IA', icon: <Bot className="w-5 h-5" /> },
    { id: 'online', label: 'En ligne', icon: <Globe className="w-5 h-5" /> }
  ];

  const timeControls = [
    { id: 'bullet', label: 'Bullet', time: '1-2 min', icon: <Zap className="w-4 h-4" /> },
    { id: 'blitz', label: 'Blitz', time: '3-5 min', icon: <Clock className="w-4 h-4" /> },
    { id: 'rapid', label: 'Rapide', time: '10-15 min', icon: <Timer className="w-4 h-4" /> },
    { id: 'classic', label: 'Classique', time: '30 min', icon: <Hourglass className="w-4 h-4" /> },
    { id: 'unlimited', label: 'Sans limite', time: '∞', icon: <Infinity className="w-4 h-4" /> }
  ];

  const colors = [
    { id: 'white', label: 'Blancs', symbol: '⚪' },
    { id: 'black', label: 'Noirs', symbol: '⚫' },
    { id: 'random', label: 'Aléatoire', icon: <Shuffle className="w-4 h-4" /> }
  ];

  const aiLevels = [
    { id: 'easy', label: 'Facile', emoji: '😊' },
    { id: 'medium', label: 'Moyen', emoji: '🤔' },
    { id: 'hard', label: 'Difficile', emoji: '😈' }
  ];

  return (
    <div className="space-y-6">
      {/* Game Mode */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Mode de jeu</h3>
        <div className="grid grid-cols-2 gap-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSettings({ ...settings, mode: mode.id })}
              className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                settings.mode === mode.id
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              {mode.icon}
              <span className="font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Control */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Contrôle du temps</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {timeControls.map((tc) => (
            <button
              key={tc.id}
              onClick={() => setSettings({ ...settings, timeControl: tc.id })}
              className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                settings.timeControl === tc.id
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tc.icon}
              <span className="text-xs font-medium">{tc.label}</span>
              <span className="text-[10px] opacity-70">{tc.time}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Choice */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Choisir couleur</h3>
        <div className="grid grid-cols-3 gap-3">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => setSettings({ ...settings, color: color.id })}
              className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                settings.color === color.id
                  ? 'bg-amber-500/20 border-amber-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              {color.symbol ? (
                <span className="text-xl">{color.symbol}</span>
              ) : (
                color.icon
              )}
              <span className="font-medium">{color.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Level (only if vs AI) */}
      {settings.mode === 'ai' && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Niveau IA</h3>
          <div className="grid grid-cols-3 gap-3">
            {aiLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setSettings({ ...settings, aiLevel: level.id })}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                  settings.aiLevel === level.id
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl">{level.emoji}</span>
                <span className="font-medium text-sm">{level.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={() => {
          console.log('🎮 BOUTON CLIQUE - Settings:', settings);
          if (settings.mode === 'ai') {
            const finalColor = settings.color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : settings.color;
            console.log('🤖 Mode IA - Redirection vers GameRoom');
            window.location.href = `/GameRoom?mode=ai&color=${finalColor}&aiLevel=${settings.aiLevel}&timeControl=${settings.timeControl}`;
          } else {
            console.log('🌐 Mode Online - Appel onStart');
            onStart();
          }
        }}
        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 rounded-lg"
      >
        Commencer la partie
      </button>
    </div>
  );
}