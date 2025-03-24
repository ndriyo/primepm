import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import Image from 'next/image';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header di bagian atas */}
      <header className="bg-white shadow-sm py-0 px-6 flex items-center">
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
      
      {/* Bagian bawah header yang memuat sidebar & konten utama */}
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
