'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import Providers from './providers';
import { SidebarProvider } from './_contexts/SidebarContext';
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
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
