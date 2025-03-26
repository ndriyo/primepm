'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import Providers from './providers';
import { SidebarProvider } from './_contexts/SidebarContext';
import { AuthProvider } from './_contexts/AuthContext';
import { ProjectProvider } from './_contexts/ProjectContext';
import { CriteriaProvider } from './_contexts/CriteriaContext';
import { ProjectSearchProvider } from './_contexts/ProjectSearchContext';
import { DepartmentProvider } from './_contexts/DepartmentContext';
import DevAuthSwitcher from './_components/dev/DevAuthSwitcher';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {/* DevAuthSwitcher is positioned fixed, so it will appear on top of other content */}
          <DevAuthSwitcher />
          <Suspense fallback={<div>Loading...</div>}>
            <ProjectSearchProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </ProjectSearchProvider>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
