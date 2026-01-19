import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function UserAvatar({ user, size = 'default', className = '' }) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
    '3xl': 'w-32 h-32'
  };

  const fallbackBgClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-6xl'
  };

  const hasAvatar = user?.avatar_url && user.avatar_url.trim() !== '';
  const initials = user?.full_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Avatar className={`${sizeClasses[size]} border-2 border-[#D4A574] ${className}`}>
      {hasAvatar && <AvatarImage src={user.avatar_url} alt={user?.full_name || 'User'} />}
      <AvatarFallback className={`bg-[#8B5A2B] text-[#F5E6D3] font-bold ${fallbackBgClasses[size]}`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}