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
    return <GameSetup onStart={handleStartGame} onBack={() => navigate(createPageUrl('Play'))} gameType="chess" />;
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