'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useSidebar } from '@/app/contexts/SidebarContext';
import { useEffect } from 'react';
import Image from 'next/image';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  const { desktopSidebarOpen } = useSidebar();
  
  // Add/remove a CSS class to the document body based on sidebar state
  // This allows us to use CSS variables for more efficient transitions
  useEffect(() => {
    if (desktopSidebarOpen) {
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.body.classList.add('sidebar-collapsed');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [desktopSidebarOpen]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header - hidden on mobile, visible on desktop */}
      <header className="hidden lg:flex bg-white shadow-sm py-0 px-6 items-center">
        <div className="flex items-center">
          <Image
            src="https://zwweamxsxemiefdlkgzn.supabase.co/storage/v1/object/public/asset/logo_transparent.png"
            alt="PrimePM Logo"
            width={96}
            height={96}
            className="h-24 w-auto mr-3"
            priority
          />
        </div>
      </header>
      
      {/* Main content area with sidebar - using CSS Grid for more control */}
      <div 
        className={`
          grid grid-cols-[auto_1fr] flex-1
          transition-all duration-300 ease-in-out
        `}
        style={{
          // Using CSS Grid to dynamically adjust based on sidebar state
          gridTemplateColumns: desktopSidebarOpen ? 'auto 1fr' : '0 1fr'
        }}
      >
        <Sidebar />
        
        {/* Main content wrapper - will expand automatically with grid layout */}
        <div className="w-full overflow-y-auto transition-all duration-300 ease-in-out">
          {/* Added padding-top for mobile to prevent content being hidden under the fixed header */}
          <main className="p-4 lg:p-6 pt-16 lg:pt-6">
            {/* Content expands to full width automatically */}
            <div className={`
              w-full mx-auto transition-all duration-300 ease-in-out
              ${!desktopSidebarOpen ? 'lg:pl-12' : ''}
            `}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
