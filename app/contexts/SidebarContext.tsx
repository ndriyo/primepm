'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Load user preference from localStorage (if available)
  useEffect(() => {
    const savedState = localStorage.getItem('desktopSidebarOpen');
    if (savedState !== null) {
      setDesktopSidebarOpen(savedState === 'true');
    }
  }, []);

  // Save user preference when sidebar state changes
  useEffect(() => {
    localStorage.setItem('desktopSidebarOpen', String(desktopSidebarOpen));
  }, [desktopSidebarOpen]);

  const toggleSidebar = () => {
    setDesktopSidebarOpen(!desktopSidebarOpen);
  };

  return (
    <SidebarContext.Provider
      value={{ desktopSidebarOpen, setDesktopSidebarOpen, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
