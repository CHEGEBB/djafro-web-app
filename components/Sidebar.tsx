// components/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { 
  Home, Film, Compass, Library, User, 
  LogOut, Menu, X, Star, Search, Calendar, Clock,
  Heart, Settings, TrendingUp, Award, Video
} from 'lucide-react';
import '@/styles/Sidebar.scss';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onToggle }) => {
  const pathname = usePathname();
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, don't render to avoid hydration issues
  if (!mounted) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const primaryNavItems = [
    { path: '/', name: 'Home', icon: <Home /> },
    { path: '/movies', name: 'Movies', icon: <Film /> },
    { path: '/discover', name: 'Discover', icon: <Compass /> },
    { path: '/trending', name: 'Trending', icon: <TrendingUp /> },
  ];
  
  const libraryNavItems = [
    { path: '/library', name: 'My Library', icon: <Library /> },
    { path: '/watchlist', name: 'Watchlist', icon: <Heart /> },
    { path: '/history', name: 'History', icon: <Clock /> },
    { path: '/favorites', name: 'Favorites', icon: <Star /> },
  ];
  
  const categoryNavItems = [
    { path: '/category/action', name: 'Action', icon: <Video /> },
    { path: '/category/comedy', name: 'Comedy', icon: <Video /> },
    { path: '/category/drama', name: 'Drama', icon: <Video /> },
    { path: '/category/awards', name: 'Award Winners', icon: <Award /> },
  ];

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
          style={{ backgroundColor: colors.surface }}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar__header">
          <Link href="/" className="sidebar__logo" onClick={isMobile ? onToggle : undefined}>
            <span className="sidebar__logo-text" style={{ color: colors.primary }}>
              DJ Afro<span className="sidebar__logo-text--white">Movies</span>
            </span>
          </Link>
        </div>

        <div className="sidebar__search">
          <div className={`sidebar__search-container ${searchActive ? 'sidebar__search-container--active' : ''}`}>
            <input
              type="text"
              placeholder="Search everything"
              className="sidebar__search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setSearchActive(false)}
            />
            <Search className="sidebar__search-icon" />
          </div>
        </div>
        
        <div className="sidebar__nav-container">
          <div className="sidebar__section">
            <div className="sidebar__section-header">Main Menu</div>
            <nav className="sidebar__nav">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={isMobile ? onToggle : undefined}
                  className={`sidebar__nav-item ${isActive(item.path) ? 'sidebar__nav-item--active' : ''}`}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="sidebar__section">
            <div className="sidebar__section-header">My Content</div>
            <nav className="sidebar__nav">
              {libraryNavItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={isMobile ? onToggle : undefined}
                  className={`sidebar__nav-item ${isActive(item.path) ? 'sidebar__nav-item--active' : ''}`}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="sidebar__section">
            <div className="sidebar__section-header">Categories</div>
            <nav className="sidebar__nav">
              {categoryNavItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={isMobile ? onToggle : undefined}
                  className={`sidebar__nav-item ${isActive(item.path) ? 'sidebar__nav-item--active' : ''}`}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="sidebar__footer">
          <Link href="/profile" className="sidebar__nav-item">
            <span className="sidebar__nav-icon"><User /></span>
            Profile
          </Link>
          <Link href="/settings" className="sidebar__nav-item">
            <span className="sidebar__nav-icon"><Settings /></span>
            Settings
          </Link>
          <button className="sidebar__logout">
            <LogOut className="sidebar__logout-icon" />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;