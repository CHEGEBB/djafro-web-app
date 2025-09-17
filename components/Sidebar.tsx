'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { authService } from '@/services/auth_service';
import type { AuthState } from '@/services/auth_service';
import { 
  Home, Film, Compass, Library, User, 
  LogOut, Menu, X, Search, Play,
  Heart
} from 'lucide-react';
import '@/styles/Sidebar.scss';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onToggle }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(setAuthState);
    
    return () => {
      unsubscribe();
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      await authService.logout();
      
      // Close sidebar if on mobile
      if (isMobile && isOpen) {
        onToggle();
      }
      
      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { path: '/dashboard', name: 'Home', icon: <Home /> },
    { path: '/movies', name: 'Movies', icon: <Film /> },
    { path: '/discover', name: 'Discover', icon: <Compass /> },
    { path: '/library', name: 'Library', icon: <Library /> },
    { path: '/watchlist', name: 'Watchlist', icon: <Heart /> },
  ];

  const { user } = authState;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="sidebar__overlay"
          onClick={onToggle}
        />
      )}
      
      {/* Mobile toggle button */}
      {isMobile && (
        <button 
          onClick={onToggle}
          className="sidebar__toggle"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar__header">
          <Link href="/" className="sidebar__logo" onClick={isMobile ? onToggle : undefined}>
            <Play className="sidebar__logo-icon" size={18} />
            <span className="sidebar__logo-text">
              DJ Afro<span className="sidebar__logo-accent">Movies</span>
            </span>
          </Link>
        </div>

        <div className="sidebar__search">
          <div className={`sidebar__search-container ${searchActive ? 'sidebar__search-container--active' : ''}`}>
            <input
              type="text"
              placeholder="Search..."
              className="sidebar__search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setSearchActive(false)}
            />
            <Search className="sidebar__search-icon" size={16} />
          </div>
        </div>
        
        <div className="sidebar__nav-container">
          <nav className="sidebar__nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={isMobile ? onToggle : undefined}
                className={`sidebar__nav-item ${isActive(item.path) ? 'sidebar__nav-item--active' : ''}`}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                <span className="sidebar__nav-text">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="sidebar__footer">
          <Link 
            href="/profile" 
            className="sidebar__footer-item"
            onClick={isMobile ? onToggle : undefined}
          >
            <User size={18} />
            <span>{user?.name || 'Profile'}</span>
          </Link>
          <button 
            className="sidebar__logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={18} />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;