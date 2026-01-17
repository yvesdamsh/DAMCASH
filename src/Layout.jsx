import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Home, Search, Gamepad2, Mail, Trophy, Gem, User, LogOut, Menu, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBadge from './components/notifications/NotificationBadge.jsx';
import InvitationBadge from './components/notifications/InvitationBadge.jsx';
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

  useEffect(() => {
    if (!user) return;

    // Heartbeat: mettre à jour le status online toutes les 30 secondes
    const heartbeatInterval = setInterval(async () => {
      try {
        await base44.entities.OnlineUser.filter(
          { user_id: user.id },
          '-updated_date',
          1
        ).then(async (results) => {
          if (results.length > 0) {
            await base44.entities.OnlineUser.update(results[0].id, {
              status: 'online',
              last_seen: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        console.log('Erreur heartbeat:', error);
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [user]);

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

        // Créer/mettre à jour l'entrée OnlineUser
        try {
          const existingOnlineUser = await base44.entities.OnlineUser.filter(
            { user_id: currentUser.id },
            '-updated_date',
            1
          );

          if (existingOnlineUser.length > 0) {
            // Mettre à jour
            await base44.entities.OnlineUser.update(existingOnlineUser[0].id, {
              status: 'online',
              last_seen: new Date().toISOString()
            });
          } else {
            // Créer nouvelle entrée
            await base44.entities.OnlineUser.create({
              user_id: currentUser.id,
              username: currentUser.full_name,
              status: 'online',
              last_seen: new Date().toISOString()
            });
          }
        } catch (onlineError) {
          console.log('Erreur OnlineUser:', onlineError);
        }
      }
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const handleLogout = () => {
    try {
      if (typeof base44 !== 'undefined' && base44.auth) {
        base44.auth.logout();
      }
    } catch(e) {}
    window.location.href = window.location.origin;
  };

  const navItems = [
    { name: 'Accueil', icon: Home, page: 'Home' },
    { name: 'Recherche', icon: Search, page: 'Search' },
    { name: 'Jouer', icon: Gamepad2, page: 'Play' },
    { name: 'Invitations', icon: Mail, page: 'Invitations', showInvitationBadge: true },
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
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] via-[#5D3A1A] to-[#2C1810] text-[#F5E6D3]">
      <style>{`
        :root {
          --earth-dark: #2C1810;
          --earth-medium: #5D3A1A;
          --earth-light: #8B5A2B;
          --gold-accent: #D4A574;
          --cream-text: #F5E6D3;
        }
        .glass-card {
          background: rgba(93, 58, 26, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(212, 165, 116, 0.2);
        }
        .gold-gradient {
          background: linear-gradient(135deg, #D4A574, #8B5A2B);
        }
        .premium-gradient {
          background: linear-gradient(135deg, #5D3A1A, #2C1810);
        }
        .nav-active {
          background: linear-gradient(135deg, rgba(212, 165, 116, 0.3), rgba(139, 90, 43, 0.2));
          border-color: rgba(212, 165, 116, 0.5);
        }
        body {
          background: #2C1810;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-[#D4A574]/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#1a0f0f]" fill="currentColor">
                <path d="M5 20h14v2H5v-2zm7-18L4 8h3v8h4V8h2v8h4V8h3l-8-6z"/>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#F5E6D3] to-[#D4A574] bg-clip-text text-transparent hidden sm:block">
              Board Masters
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
                  <Gem className="w-4 h-4 text-[#D4A574]" />
                  <span className="font-semibold text-[#F5E6D3]">{userData?.gems || 100}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Avatar className="w-9 h-9 border-2 border-[#D4A574]/50">
                        <AvatarImage src={userData?.avatar_url} />
                        <AvatarFallback className="bg-[#5D3A1A] text-[#F5E6D3]">
                          {user.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:block">{user.full_name}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#5D3A1A] border-[#D4A574]/50 text-[#F5E6D3]">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Profile')} className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Notifications')} className="flex items-center gap-2 cursor-pointer">
                        <Bell className="w-4 h-4" />
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Shop')} className="flex items-center gap-2 cursor-pointer">
                        <Gem className="w-4 h-4" />
                        Boutique
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#D4A574]/30" />
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
                className="gold-gradient text-[#2C1810] font-semibold hover:opacity-90 shadow-lg"
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-[#D4A574]/30">
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
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <item.icon 
                    className={`w-5 h-5 ${
                      isActive(item.page) ? 'text-[#D4A574]' : 'text-[#F5E6D3]/50'
                    }`} 
                  />
                  {item.showInvitationBadge && user && (
                    <InvitationBadge userEmail={user.email} userId={user.id} />
                  )}
                </motion.div>
                <span className={`text-xs ${
                  isActive(item.page) ? 'text-[#D4A574]' : 'text-[#F5E6D3]/50'
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