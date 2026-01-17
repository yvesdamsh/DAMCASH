import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Home, Search, Gamepad2, Mail, Trophy, Gem, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Initialize user data if needed
        if (!currentUser.gems) {
          await base44.auth.updateMe({ 
            gems: 100, 
            level: 1, 
            xp: 0,
            chess_rating: 1200,
            checkers_rating: 1200,
            games_played: 0,
            games_won: 0,
            is_online: true
          });
          setUserData({ gems: 100, level: 1, xp: 0 });
        } else {
          setUserData(currentUser);
        }
      }
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const navItems = [
    { name: 'Accueil', icon: Home, page: 'Home' },
    { name: 'Recherche', icon: Search, page: 'Search' },
    { name: 'Jouer', icon: Gamepad2, page: 'Play' },
    { name: 'Invitations', icon: Mail, page: 'Invitations' },
    { name: 'Tournois', icon: Trophy, page: 'Tournaments' },
  ];

  const isActive = (page) => currentPageName === page;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#2d1515] to-[#1a0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#2d1515] to-[#1a0f0f] text-white">
      <style>{`
        :root {
          --gold: #C9A227;
          --gold-light: #FFD700;
          --burgundy-dark: #1a0f0f;
          --burgundy: #2d1515;
          --burgundy-light: #4a2020;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .gold-gradient {
          background: linear-gradient(135deg, #FFD700, #C9A227);
        }
        .nav-active {
          background: linear-gradient(135deg, rgba(201, 162, 39, 0.3), rgba(255, 215, 0, 0.1));
          border-color: rgba(201, 162, 39, 0.5);
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#1a0f0f]" fill="currentColor">
                <path d="M5 20h14v2H5v-2zm7-18L4 8h3v8h4V8h2v8h4V8h3l-8-6z"/>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent hidden sm:block">
              Board Masters
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
                  <Gem className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-amber-200">{userData?.gems || 100}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Avatar className="w-9 h-9 border-2 border-amber-500/50">
                        <AvatarImage src={userData?.avatar_url} />
                        <AvatarFallback className="bg-amber-900 text-amber-200">
                          {user.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:block">{user.full_name}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2d1515] border-amber-900/50 text-white">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Profile')} className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Shop')} className="flex items-center gap-2 cursor-pointer">
                        <Gem className="w-4 h-4" />
                        Boutique
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-amber-900/30" />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-400">
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={handleLogin}
                className="gold-gradient text-[#1a0f0f] font-semibold hover:opacity-90"
              >
                Connexion
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-amber-900/30">
        <div className="max-w-lg mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive(item.page)
                    ? 'nav-active border'
                    : 'hover:bg-white/5'
                }`}
              >
                <item.icon 
                  className={`w-5 h-5 ${
                    isActive(item.page) ? 'text-amber-400' : 'text-gray-400'
                  }`} 
                />
                <span className={`text-xs ${
                  isActive(item.page) ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}