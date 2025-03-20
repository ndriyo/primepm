'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartPieIcon,
  ViewColumnsIcon,
  DocumentTextIcon,
  HomeIcon,
  Bars3Icon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  path: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Project Selection', path: '/selection', icon: ViewColumnsIcon },
  { name: 'Project Details', path: '/details', icon: DocumentTextIcon },
  { name: 'Criteria Management', path: '/criteria', icon: AdjustmentsHorizontalIcon },
  { name: 'Reports', path: '/reports', icon: ChartPieIcon },
];

export const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-16 left-0 z-40 w-full bg-white shadow-sm p-4 flex items-center">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-600"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="ml-4 flex items-center">
          <img
            src="https://zwweamxsxemiefdlkgzn.supabase.co/storage/v1/object/public/asset/logo_transparent.png"
            alt="PrimePM Logo"
            className="h-8 mr-2"
          />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-lg transform transition-transform ease-in-out duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto lg:h-full`}
      >

        <nav className="px-4 overflow-y-auto flex-1 py-5">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-primary-700' : 'text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};
