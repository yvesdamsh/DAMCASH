import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Circle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import GameSetup from '../components/game/GameSetup';
import CheckersBoard from '../components/game/CheckersBoard';

export default function Checkers() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [settings, setSettings] = useState({
    mode: 'ai',
    timeControl: 'blitz',
    color: 'white',
    aiLevel: 'medium'
  });

  const handleStart = async () => {
    console.log('🎮 handleStart called with settings:', settings);
    
    const finalColor = settings.color === 'random' 
      ? (Math.random() > 0.5 ? 'white' : 'black')
      : settings.color;
    
    console.log('🎯 Final color:', finalColor);
    
    if (settings.mode === 'online') {
      // Mode multijoueur - créer une session et rediriger vers GameRoom
      try {
        console.log('🌐 Creating online game session...');
        const user = await base44.auth.me();
        const roomId = `checkers_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const TIME_CONTROLS = {
          bullet: 60,
          blitz: 180,
          rapid: 600,
          classic: 1800,
          unlimited: null
        };
        
        const timeValue = TIME_CONTROLS[settings.timeControl];
        
        await base44.entities.GameSession.create({
          room_id: roomId,
          player1_id: user.id,
          player1_email: user.email,
          player1_name: user.full_name,
          game_type: 'checkers',
          status: 'waiting',
          time_control: settings.timeControl,
          white_time: timeValue,
          black_time: timeValue,
          current_turn: 'white',
          board_state: null
        });
        
        console.log('✅ Session created, navigating to GameRoom');
        navigate(`/GameRoom?roomId=${roomId}&waiting=true`);
      } catch (error) {
        console.error('❌ Error creating game session:', error);
      }
    } else {
      // Mode IA - rediriger vers GameRoom avec mode=ai
      console.log('🤖 Starting AI game');
      navigate(`/GameRoom?mode=ai&playerColor=${finalColor}&aiLevel=${settings.aiLevel}`);
    }
  };

  const handleBack = () => {
    setGameStarted(false);
  };

  return (
    <div className="w-full px-4 py-6 flex flex-col items-center min-h-screen">
      {/* Header */}
       <div className="w-full max-w-6xl flex items-center gap-4 mb-6">
         <Link to={createPageUrl(gameStarted ? 'Checkers' : 'Play')}>
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
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
             <Circle className="w-5 h-5 text-white" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-white">Dames Internationales</h1>
             <p className="text-xs text-gray-400">
               {gameStarted 
                 ? `${settings.mode === 'ai' ? 'vs IA' : 'En ligne'} • ${settings.timeControl}`
                 : 'Configuration de la partie'
               }
             </p>
           </div>
         </div>
       </div>

       <div className="w-full max-w-6xl flex justify-center">
         {!gameStarted ? (
           <GameSetup 
             gameType="checkers"
             settings={settings}
             setSettings={setSettings}
             onStart={handleStart}
           />
         ) : (
           <CheckersBoard 
             playerColor={settings.color}
             aiLevel={settings.aiLevel}
           />
         )}
       </div>
      </div>
      );
}