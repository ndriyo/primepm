import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import DevAuthSwitcher from './_components/dev/DevAuthSwitcher';
import { SidebarProvider } from './_contexts/SidebarContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PrimePM',
  description: 'Project Management Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Providers>
          <SidebarProvider>
            {children}
            <DevAuthSwitcher />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
