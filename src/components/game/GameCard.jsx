import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function GameCard({ title, subtitle, icon, image, page, gradient }) {
  return (
    <Link 
      to={createPageUrl(page)}
      className="relative overflow-hidden rounded-2xl aspect-[4/3] group cursor-pointer"
    >
      <div className={`absolute inset-0 ${gradient}`}></div>
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      
      <div className="relative h-full flex flex-col justify-between p-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
          {icon}
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-xs text-gray-300">{subtitle}</p>
        </div>
      </div>
      
      <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-amber-500/50 transition-colors"></div>
    </Link>
  );
}