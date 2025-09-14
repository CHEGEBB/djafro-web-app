'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { 
  Home, Film, Compass, Library, User, 
  LogOut, Menu, X, Search, Settings,
  TrendingUp, Heart, Play
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

  if (!mounted) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { path: '/', name: 'Home', icon: <Home /> },
    { path: '/movies', name: 'Movies', icon: <Film /> },
    { path: '/discover', name: 'Discover', icon: <Compass /> },
    { path: '/trending', name: 'Trending', icon: <TrendingUp /> },
    { path: '/library', name: 'My List', icon: <Library /> },
    { path: '/watchlist', name: 'Watchlist', icon: <Heart /> },
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
          <Link href="/profile" className="sidebar__footer-item">
            <User size={18} />
            <span>Profile</span>
          </Link>
          <Link href="/settings" className="sidebar__footer-item">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button className="sidebar__logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;