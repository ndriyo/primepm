import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <div className="lg:pt-0 pt-16">
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
