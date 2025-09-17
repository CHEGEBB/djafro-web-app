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
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
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
        ${sidebarOpen ? (isMobile ? 'ml-0' : 'ml-[250px]') : 'ml-0'}
      `}>
        <div className="container mx-auto px-2 sm:px-4 py-2">
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutController;