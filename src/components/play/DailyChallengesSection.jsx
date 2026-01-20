import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function DailyChallengesSection({ gameType }) {
  const [timeLeft, setTimeLeft] = useState('18h 32min');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow - now;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hours}h ${mins}min`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const challenges = [
    {
      id: 1,
      title: 'Gagne 3 parties',
      emoji: '🏆',
      reward: 50,
      progress: 2,
      total: 3,
      color: 'from-yellow-600 to-orange-600'
    },
    {
      id: 2,
      title: 'Joue une partie Bullet',
      emoji: '⚡',
      reward: 25,
      progress: 0,
      total: 1,
      color: 'from-red-600 to-orange-600'
    },
    {
      id: 3,
      title: 'Série de 5 victoires',
      emoji: '🔥',
      reward: 100,
      progress: 3,
      total: 5,
      color: 'from-orange-600 to-pink-600'
    }
  ];

  return (
    <div className="mb-12">
      <div className="border-l-4 border-[#D4A574] pl-6 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#F5E6D3] mb-2">
          Défis du jour
        </h2>
        <p className="text-[#D4A574]">Se réinitialise dans {timeLeft}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {challenges.map((challenge, idx) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ translateY: -4 }}
            className="relative group"
          >
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#2C1810] to-[#5D3A1A] border border-[#D4A574]/30 hover:border-[#D4A574]/60 transition-all p-6 hover:shadow-lg hover:shadow-[#D4A574]/10">
              {/* Subtle background */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #D4A574 1px, transparent 0)',
                backgroundSize: '30px 30px'
              }} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl opacity-60">{challenge.emoji}</div>
                  <Badge className="bg-[#D4A574] text-[#2C1810] font-bold text-xs">
                    +{challenge.reward} gemmes
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#F5E6D3] mb-4">{challenge.title}</h3>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[#D4A574]">
                    <span>Progression</span>
                    <span className="font-bold text-[#F5E6D3]">{challenge.progress}/{challenge.total}</span>
                  </div>
                  <Progress 
                    value={(challenge.progress / challenge.total) * 100}
                    className="bg-[#1a0f0f] h-2"
                  />
                </div>

                {/* Completion status */}
                {challenge.progress === challenge.total && (
                  <div className="mt-4 p-2 bg-[#D4A574]/20 border border-[#D4A574]/50 rounded">
                    <p className="text-[#D4A574] text-xs font-bold text-center">✓ COMPLÉTÉ</p>
                  </div>
                )}
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-[#D4A574] rounded-lg" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}