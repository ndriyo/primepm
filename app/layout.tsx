'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';
import { SidebarProvider } from './_contexts/SidebarContext';
import { AuthProvider } from './_contexts/AuthContext';
import { ProjectProvider } from './_contexts/ProjectContext';
import { CriteriaProvider } from './_contexts/CriteriaContext';
import { ProjectSearchProvider } from './_contexts/ProjectSearchContext';
import { DepartmentProvider } from './_contexts/DepartmentContext';
import { CommitteeProvider } from './_contexts/CommitteeContext';

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
          <ProjectSearchProvider>
            <SidebarProvider>
              <CommitteeProvider>
                {children}
              </CommitteeProvider>
            </SidebarProvider>
          </ProjectSearchProvider>
        </Providers>
      </body>
    </html>
  );
}
