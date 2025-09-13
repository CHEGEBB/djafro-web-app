// components/LayoutController.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface LayoutControllerProps {
  children: React.ReactNode;
}

const LayoutController: React.FC<LayoutControllerProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    // Detect if we're on mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Check on mount
    checkIfMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
      />
      
      <main className={`
        flex-1 overflow-auto transition-all duration-300
        ${isMobile ? 'w-full' : sidebarOpen ? 'ml-0' : 'ml-0 w-full'}
      `}>
        <div className="container mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutController;