import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';

// Presets courants type Chess.com
const PRESETS = [
  // Bullet
  { label: '1+0', minutes: 1, increment: 0, category: 'bullet', emoji: '⚡' },
  { label: '1+1', minutes: 1, increment: 1, category: 'bullet', emoji: '⚡' },
  { label: '2+1', minutes: 2, increment: 1, category: 'bullet', emoji: '⚡' },
  // Blitz
  { label: '3+0', minutes: 3, increment: 0, category: 'blitz', emoji: '🔥' },
  { label: '3+2', minutes: 3, increment: 2, category: 'blitz', emoji: '🔥' },
  { label: '5+0', minutes: 5, increment: 0, category: 'blitz', emoji: '🔥' },
  { label: '5+3', minutes: 5, increment: 3, category: 'blitz', emoji: '🔥' },
  // Rapide
  { label: '10+0', minutes: 10, increment: 0, category: 'rapid', emoji: '⏱' },
  { label: '10+5', minutes: 10, increment: 5, category: 'rapid', emoji: '⏱' },
  { label: '15+10', minutes: 15, increment: 10, category: 'rapid', emoji: '⏱' },
  // Classique
  { label: '30+0', minutes: 30, increment: 0, category: 'classic', emoji: '♟' },
  { label: '30+20', minutes: 30, increment: 20, category: 'classic', emoji: '♟' },
];

const CATEGORY_CONFIG = {
  bullet:  { label: 'Bullet',    color: 'from-yellow-600 to-orange-600', border: 'border-orange-500/40', text: 'text-orange-300', bg: 'bg-orange-500/15' },
  blitz:   { label: 'Blitz',     color: 'from-red-600 to-rose-600',      border: 'border-red-500/40',    text: 'text-red-300',    bg: 'bg-red-500/15' },
  rapid:   { label: 'Rapide',    color: 'from-blue-600 to-cyan-600',     border: 'border-blue-500/40',   text: 'text-blue-300',   bg: 'bg-blue-500/15' },
  classic: { label: 'Classique', color: 'from-green-600 to-teal-600',    border: 'border-green-500/40',  text: 'text-green-300',  bg: 'bg-green-500/15' },
};

/**
 * TimeControlPicker
 * value: { minutes, increment, label, category }
 * onChange: (value) => void
 */
export default function TimeControlPicker({ value, onChange, compact = false }) {
  const [customMode, setCustomMode] = useState(false);
  const [customMin, setCustomMin] = useState(value?.minutes || 5);
  const [customInc, setCustomInc] = useState(value?.increment || 0);

  const activeCategory = value?.category || 'blitz';
  const cfg = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG.blitz;

  const selectPreset = (preset) => {
    setCustomMode(false);
    onChange(preset);
  };

  const applyCustom = () => {
    const min = parseInt(customMin) || 5;
    const inc = parseInt(customInc) || 0;
    let category = 'classic';
    if (min <= 2) category = 'bullet';
    else if (min <= 5) category = 'blitz';
    else if (min <= 15) category = 'rapid';
    const label = `${min}+${inc}`;
    onChange({ label, minutes: min, increment: inc, category });
  };

  return (
    <div className="space-y-3">
      {/* Current value badge */}
      {value && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cfg.border} ${cfg.bg}`}>
          <Clock className={`w-4 h-4 ${cfg.text}`} />
          <span className={`text-lg font-black ${cfg.text}`}>{value.label}</span>
          <span className={`text-xs ${cfg.text} opacity-70`}>{CATEGORY_CONFIG[value.category]?.label}</span>
          <span className="text-xs text-[#D4A574]/40 ml-auto">
            {value.minutes} min + {value.increment}s/coup
          </span>
        </div>
      )}

      {/* Categories + presets */}
      {Object.keys(CATEGORY_CONFIG).map((cat) => {
        const catCfg = CATEGORY_CONFIG[cat];
        const catPresets = PRESETS.filter(p => p.category === cat);
        return (
          <div key={cat}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${catCfg.text} mb-1.5 opacity-70`}>
              {catPresets[0]?.emoji} {catCfg.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {catPresets.map((preset) => {
                const isSelected = value?.label === preset.label;
                return (
                  <motion.button
                    key={preset.label}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => selectPreset(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-black border transition-all ${
                      isSelected
                        ? `${catCfg.bg} ${catCfg.border} ${catCfg.text}`
                        : 'bg-black/20 border-[#D4A574]/10 text-[#D4A574]/50 hover:border-[#D4A574]/30 hover:text-[#D4A574]/80'
                    }`}
                  >
                    {preset.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Custom */}
      <div>
        <button
          onClick={() => setCustomMode(!customMode)}
          className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]/40 hover:text-[#D4A574]/70 transition-colors flex items-center gap-1"
        >
          <Zap className="w-3 h-3" /> Personnalisé
        </button>
        {customMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="1" max="180" value={customMin}
                onChange={e => setCustomMin(e.target.value)}
                className="w-16 bg-black/30 border border-[#D4A574]/20 rounded-lg px-2 py-1.5 text-sm text-center text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]/50"
              />
              <span className="text-xs text-[#D4A574]/50">min</span>
            </div>
            <span className="text-[#D4A574]/30 font-black">+</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" max="60" value={customInc}
                onChange={e => setCustomInc(e.target.value)}
                className="w-16 bg-black/30 border border-[#D4A574]/20 rounded-lg px-2 py-1.5 text-sm text-center text-[#F5E6D3] focus:outline-none focus:border-[#D4A574]/50"
              />
              <span className="text-xs text-[#D4A574]/50">sec</span>
            </div>
            <button onClick={applyCustom}
              className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#D4A574] text-[#1a0c06]">
              OK
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Utility: get time_control category label from label like "3+2" */
export function formatTimeControl(tc) {
  if (!tc) return '';
  if (typeof tc === 'object') return tc.label || '';
  return tc; // already a string like "3+2" or "blitz"
}