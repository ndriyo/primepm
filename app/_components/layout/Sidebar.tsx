'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  ChartPieIcon,
  ViewColumnsIcon,
  DocumentTextIcon,
  HomeIcon,
  Bars3Icon,
  AdjustmentsHorizontalIcon,
  PlusCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useSidebar } from '@/app/_contexts/SidebarContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Project Selection', path: '/selection', icon: ViewColumnsIcon },
  { name: 'Project Information', path: '/details', icon: DocumentTextIcon },
  { name: 'Criteria Management', path: '/criteria', icon: AdjustmentsHorizontalIcon },
  { name: 'Reports', path: '/reports', icon: ChartPieIcon },
];

export const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { desktopSidebarOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white shadow-sm p-4 flex items-center">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-600"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="sr-only">Toggle sidebar</span>
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
        <div className="ml-4 flex items-center">
          <Image
            src="https://zwweamxsxemiefdlkgzn.supabase.co/storage/v1/object/public/asset/logo_transparent.png"
            alt="PrimePM Logo"
            width={32}
            height={32}
            className="h-8 w-auto mr-2"
            priority
          />
        </div>
      </div>

      {/* Mobile sidebar */}
      {/* Desktop sidebar toggle button - always visible, positioned outside when collapsed */}
      <div className={`hidden lg:block fixed top-28 z-50 transition-all duration-300 ease-in-out ${
        desktopSidebarOpen ? 'left-64' : 'left-0'
      }`}>
        <button
          type="button"
          className={`bg-white p-2 rounded-r-md shadow-md border border-l-0 border-gray-200 text-gray-500 hover:text-gray-700 ${
            desktopSidebarOpen ? '-ml-3' : 'ml-0'
          }`}
          onClick={toggleSidebar}
        >
          <span className="sr-only">Toggle sidebar</span>
          {desktopSidebarOpen ? (
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white shadow-lg transform transition-transform ease-in-out duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:z-auto ${
          desktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
        }`}
      >
        {/* Sidebar header with logo and close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {/* Mobile close button */}
          <button
            type="button"
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

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
