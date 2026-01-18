import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import ChessBoard from '../components/game/ChessBoard';
import GameSetup from '../components/game/GameSetup';

export default function Chess() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [settings, setSettings] = useState({
    mode: 'ai',
    timeControl: 'classic',
    playerColor: 'white',
    aiLevel: 'medium'
  });

  const handleStartGame = async (config) => {
    if (!config) return;
    if (config.mode === 'ai') {
      setSettings(config);
      setGameStarted(true);
    } else {
      try {
        const user = await base44.auth.me();
        const room = await base44.entities.Room.create({
          name: `Partie d'échecs - ${user.full_name}`,
          owner_id: user.id,
          owner_name: user.full_name,
          game_type: 'chess',
          is_private: false,
          players: [user.id],
          current_players: 1,
          status: 'waiting',
          time_control: config.timeControl
        });

        const session = await base44.entities.GameSession.create({
          room_id: room.id,
          player1_id: user.id,
          player1_email: user.email,
          player1_name: user.full_name,
          game_type: 'chess',
          status: 'waiting',
          current_turn: 'white',
          board_state: JSON.stringify(Array(8).fill(null).map(() => Array(8).fill(null))),
          time_control: config.timeControl,
          white_time: { bullet: 60, blitz: 180, rapid: 600, classic: 1800, unlimited: null }[config.timeControl],
          black_time: { bullet: 60, blitz: 180, rapid: 600, classic: 1800, unlimited: null }[config.timeControl]
        });

        navigate(`${createPageUrl('GameRoom')}?roomId=${room.id}&mode=online&gameType=chess`);
      } catch (error) {
        console.error('Erreur création partie:', error);
      }
    }
  };

  const handleBackToSetup = () => {
    setGameStarted(false);
  };

  if (!gameStarted) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col">
        <div className="p-4 border-b border-[#D4A574]/30 bg-gradient-to-b from-[#5D3A1A] to-[#2C1810]">
          <button
            onClick={() => navigate(createPageUrl('Play'))}
            className="text-[#F5E6D3] hover:bg-white/10 px-4 py-2 rounded"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold mt-2">♔ Échecs</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#2C1810] border border-[#D4A574]/30 rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#F5E6D3] mb-2">Mode de jeu</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleStartGame({ ...settings, mode: 'ai' })}
                  className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#5D3A1A] hover:from-[#A0692F] hover:to-[#6D4A1F] text-[#F5E6D3] font-bold py-2 px-4 rounded border border-[#D4A574]/50"
                >
                  🤖 Jouer contre IA
                </button>
                <button
                  onClick={() => handleStartGame({ ...settings, mode: 'online' })}
                  className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#5D3A1A] hover:from-[#A0692F] hover:to-[#6D4A1F] text-[#F5E6D3] font-bold py-2 px-4 rounded border border-[#D4A574]/50"
                >
                  👥 Multijoueur
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#F5E6D3] mb-2">Contrôle du temps</h2>
              <div className="space-y-2">
                {['bullet', 'blitz', 'rapid', 'classic', 'unlimited'].map(tc => (
                  <button
                    key={tc}
                    onClick={() => setSettings({ ...settings, timeControl: tc })}
                    className={`w-full py-2 px-4 rounded border transition ${
                      settings.timeControl === tc
                        ? 'bg-[#D4A574]/20 border-[#D4A574] text-[#D4A574]'
                        : 'bg-[#2C1810] border-[#D4A574]/30 text-[#F5E6D3] hover:bg-white/5'
                    }`}
                  >
                    {tc.charAt(0).toUpperCase() + tc.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#F5E6D3] mb-2">Votre couleur</h2>
              <div className="space-y-2">
                {['white', 'black', 'random'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSettings({ ...settings, playerColor: color })}
                    className={`w-full py-2 px-4 rounded border transition ${
                      settings.playerColor === color
                        ? 'bg-[#D4A574]/20 border-[#D4A574] text-[#D4A574]'
                        : 'bg-[#2C1810] border-[#D4A574]/30 text-[#F5E6D3] hover:bg-white/5'
                    }`}
                  >
                    {color === 'white' ? '⚪' : color === 'black' ? '⚫' : '🎲'} {color.charAt(0).toUpperCase() + color.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {settings.mode === 'ai' && (
              <div>
                <h2 className="text-xl font-bold text-[#F5E6D3] mb-2">Niveau IA</h2>
                <div className="space-y-2">
                  {['easy', 'medium', 'hard'].map(level => (
                    <button
                      key={level}
                      onClick={() => setSettings({ ...settings, aiLevel: level })}
                      className={`w-full py-2 px-4 rounded border transition ${
                        settings.aiLevel === level
                          ? 'bg-[#D4A574]/20 border-[#D4A574] text-[#D4A574]'
                          : 'bg-[#2C1810] border-[#D4A574]/30 text-[#F5E6D3] hover:bg-white/5'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => handleStartGame(settings)}
              className="w-full bg-gradient-to-r from-[#D4A574] to-[#8B5A2B] hover:from-[#E8B680] hover:to-[#9D6A39] text-[#2C1810] font-bold py-3 px-4 rounded border border-[#D4A574]"
            >
              Commencer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3] flex flex-col">
      <div className="p-4 border-b border-[#D4A574]/30 bg-gradient-to-b from-[#5D3A1A] to-[#2C1810]">
        <button
          onClick={handleBackToSetup}
          className="text-[#F5E6D3] hover:bg-white/10 px-4 py-2 rounded"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold mt-2">♔ Échecs vs IA</h1>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto p-6">
        <ChessBoard
          playerColor={settings.playerColor}
          aiLevel={settings.aiLevel}
          onGameEnd={() => {}}
        />
      </div>
    </div>
  );
}