// components/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { 
  Home, Film, Compass, Library, User, 
  LogOut, Menu, X, Star, Search
} from 'lucide-react';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onToggle }) => {
  const pathname = usePathname();
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  
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

  const sidebarClass = `
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'relative w-64'}
    bg-[${colors.surface}] text-[${colors.textPrimary}]
    h-screen flex flex-col transition-transform duration-300 ease-in-out
    border-r border-gray-800 shadow-lg
  `;
  
  const navItems = [
    { path: '/', name: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/movies', name: 'Movies', icon: <Film className="w-5 h-5" /> },
    { path: '/discover', name: 'Discover', icon: <Compass className="w-5 h-5" /> },
    { path: '/library', name: 'Library', icon: <Library className="w-5 h-5" /> },
    { path: '/profile', name: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}
      
      {/* Mobile toggle button */}
      {isMobile && (
        <button 
          onClick={onToggle}
          className={`fixed top-4 left-4 z-50 p-2 rounded-full 
            bg-[${colors.surface}] text-[${colors.textPrimary}]
            hover:bg-[${colors.primary}] transition-colors`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}
      
      {/* Sidebar */}
      <div className={sidebarClass}>
        <div className="p-4">
          <Link href="/" className="flex items-center" onClick={isMobile ? onToggle : undefined}>
            <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
              DJ Afro<span className="text-white">Movies</span>
            </h1>
          </Link>
        </div>

        <div className="px-4 mt-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search everything"
              className={`w-full bg-gray-800 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[${colors.primary}]`}
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        <div className="mt-6 flex-1">
          <div className="px-4 text-xs font-semibold text-gray-400 uppercase">Main Menu</div>
          <nav className="mt-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={isMobile ? onToggle : undefined}
                className={`
                  flex items-center px-4 py-3 text-sm
                  ${isActive(item.path) 
                    ? `bg-[${colors.primary}] bg-opacity-20 text-[${colors.primary}] border-l-4 border-[${colors.primary}]` 
                    : `text-[${colors.textSecondary}] hover:bg-gray-800`
                  }
                  transition-colors duration-200
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
            <LogOut className="w-5 h-5 mr-3" />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;