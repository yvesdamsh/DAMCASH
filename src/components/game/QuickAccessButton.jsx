import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function QuickAccessButton({ icon, label, page }) {
  return (
    <Link 
      to={createPageUrl(page)}
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-amber-700/30 transition-colors">
        {icon}
      </div>
      <span className="text-xs text-gray-300 group-hover:text-amber-200 transition-colors">{label}</span>
    </Link>
  );
}