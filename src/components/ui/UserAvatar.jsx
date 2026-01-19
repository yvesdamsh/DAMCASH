import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function UserAvatar({ user, size = 'default', className = '', showOnlineIndicator = false }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset image error when user changes
    setImageError(false);
  }, [user?.id]);

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

  // Check for photoURL (Firebase) or avatar_url
  const photoUrl = user?.photoURL || user?.avatar_url;
  const hasAvatar = photoUrl && photoUrl.trim() !== '' && !imageError;
  const initials = user?.full_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} border-2 border-[#D4A574] rounded-full ${className}`}>
        {hasAvatar && (
          <AvatarImage 
            src={photoUrl} 
            alt={user?.full_name || 'User'}
            onError={() => setImageError(true)}
            className="object-cover"
          />
        )}
        <AvatarFallback className={`bg-[#8B5A2B] text-[#F5E6D3] font-bold ${fallbackBgClasses[size]}`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {/* Online status indicator */}
      {showOnlineIndicator && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#2C1810]" />
      )}
    </div>
  );
}