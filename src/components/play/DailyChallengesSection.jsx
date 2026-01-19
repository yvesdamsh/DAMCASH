import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function DailyChallengesSection() {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#F5E6D3] mb-2">
            🎯 Défis du jour
          </h2>
          <p className="text-[#D4A574]">Se réinitialise dans {timeLeft}</p>
        </div>
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
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${challenge.color} border border-white/20 hover:border-white/40 transition-all backdrop-blur-sm p-6 hover:shadow-xl`}>
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{challenge.emoji}</div>
                  <Badge className="bg-green-500 text-black font-bold">
                    +{challenge.reward} 💎
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-4">{challenge.title}</h3>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Progression</span>
                    <span className="font-bold text-white">{challenge.progress}/{challenge.total}</span>
                  </div>
                  <Progress 
                    value={(challenge.progress / challenge.total) * 100}
                    className="bg-white/20 h-2"
                  />
                </div>

                {/* Completion status */}
                {challenge.progress === challenge.total && (
                  <div className="mt-4 p-2 bg-green-500/30 border border-green-500/50 rounded-lg">
                    <p className="text-green-300 text-xs font-bold text-center">✓ COMPLÉTÉ</p>
                  </div>
                )}
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/20 to-transparent" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}