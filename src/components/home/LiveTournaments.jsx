import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Activity, Users, Clock, ChevronRight } from 'lucide-react';

export default function LiveTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    loadTournaments();
    const interval = setInterval(loadTournaments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = {};
      tournaments.forEach(t => {
        if (t.start_date) {
          const diff = new Date(t.start_date) - new Date();
          if (diff > 0) {
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            newTimeLeft[t.id] = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          } else {
            newTimeLeft[t.id] = '00:00:00';
          }
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [tournaments]);

  const loadTournaments = async () => {
    try {
      const data = await base44.entities.Tournament.filter({ status: 'in_progress' }, '-start_date', 2);
      setTournaments(data.length > 0 ? data : mockTournaments);
    } catch (e) {
      setTournaments(mockTournaments);
    }
  };

  const mockTournaments = [
    {
      id: '1',
      name: 'SUPER BLITZ MONDAY',
      game_type: 'chess',
      participants: Array(1204).fill('user'),
      max_participants: 2000,
      start_date: new Date(Date.now() + 12 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      name: 'CHECKERS WORLD SERIES',
      game_type: 'checkers',
      participants: Array(842).fill('user'),
      max_participants: 1500,
      start_date: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }
  ];

  if (tournaments.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-bold text-[#F5E6D3]">TOURNOIS EN COURS</h2>
      </div>

      {/* Tournament Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map((tournament) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#2C1810] to-[#1a0f0f] border border-[#D4A574]/30 rounded-lg p-5 relative overflow-hidden"
          >
            {/* Live Badge */}
            <div className="absolute top-3 right-3">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                LIVE
              </span>
            </div>

            {/* Tournament Name */}
            <h3 className="text-lg font-bold text-[#F5E6D3] mb-1">
              {tournament.name}
            </h3>
            <p className="text-sm text-[#D4A574] mb-4">
              MENEUR: {tournament.game_type === 'chess' ? 'MAGNUS_CLONE' : 'SLIDERPRO'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#1a0f0f] rounded-lg p-3 border border-[#D4A574]/20">
                <p className="text-xs text-[#D4A574] uppercase mb-1">Fin dans</p>
                <p className="text-xl font-bold text-red-500 font-mono">
                  {timeLeft[tournament.id] || '00:00:00'}
                </p>
              </div>
              <div className="bg-[#1a0f0f] rounded-lg p-3 border border-[#D4A574]/20">
                <p className="text-xs text-[#D4A574] uppercase mb-1">Participants</p>
                <p className="text-xl font-bold text-[#F5E6D3]">
                  {tournament.participants?.length || 0}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Link to={createPageUrl('Tournaments')}>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                REJOINDRE L'ACTION
              </button>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      <Link 
        to={createPageUrl('Tournaments')}
        className="flex items-center justify-center gap-2 text-[#D4A574] hover:text-[#F5E6D3] font-semibold mt-4 transition-colors"
      >
        Voir tous les tournois
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}