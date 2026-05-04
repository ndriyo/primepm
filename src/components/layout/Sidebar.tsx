import { useEffect, useState } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Sliders,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Tooltip } from '../ui/Tooltip';
import { useRoute, navigate, type Route } from '../../lib/router';
import { useAuth } from '../../auth/useAuth';

const COLLAPSED_KEY = 'prime-schedule:sidebar-collapsed';

interface NavItem {
  key: Route['name'];
  label: string;
  path: string;
  icon: React.ReactNode;
  matches: (route: Route) => boolean;
}

const NAV: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={16} />,
    matches: r => r.name === 'dashboard',
  },
  {
    key: 'list',
    label: 'Ongoing Project',
    path: '/projects',
    icon: <ListChecks size={16} />,
    matches: r => r.name === 'list' || r.name === 'project',
  },
  {
    key: 'submission',
    label: 'Project Submission',
    path: '/projects/new',
    icon: <FilePlus2 size={16} />,
    matches: r => r.name === 'submission',
  },
  {
    key: 'selection',
    label: 'Project Selection',
    path: '/selection',
    icon: <Sliders size={16} />,
    matches: r => r.name === 'selection',
  },
];

export function Sidebar() {
  const route = useRoute();
  const { session, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'h-full flex flex-col bg-(--color-surface) border-r border-(--color-border) transition-[width] duration-150',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div className="h-12 flex items-center px-3 border-b border-(--color-border) gap-2">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          aria-label="Home"
          className="w-7 h-7 rounded-md bg-(--color-brand) text-white flex items-center justify-center shadow-sm hover:bg-(--color-brand-strong) transition-colors flex-shrink-0"
        >
          <Zap size={15} />
        </button>
        {!collapsed && (
          <div className="font-semibold text-[13px] tracking-tight truncate">PrimePM</div>
        )}
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = item.matches(route);
          const button = (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[13px] font-medium transition-colors',
                'border-l-2',
                active
                  ? 'bg-(--color-brand-soft) text-(--color-brand-strong) border-(--color-brand)'
                  : 'text-(--color-ink-muted) hover:bg-(--color-surface-2) hover:text-(--color-ink) border-transparent',
                collapsed && 'justify-center px-0',
              )}
            >
              <span className={active ? 'text-(--color-brand-strong)' : ''}>{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
          return collapsed ? (
            <Tooltip key={item.key} label={item.label} side="right">
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </nav>

      <div className="border-t border-(--color-border) p-2 flex flex-col gap-1">
        {session?.user?.email && !collapsed && (
          <div
            className="px-2 py-1 text-[11px] text-(--color-ink-subtle) truncate"
            title={session.user.email}
          >
            {session.user.email}
          </div>
        )}
        <SidebarAction
          collapsed={collapsed}
          icon={<LogOut size={14} />}
          label="Sign out"
          onClick={() => void signOut()}
        />
        <SidebarAction
          collapsed={collapsed}
          icon={collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          label={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => setCollapsed(c => !c)}
        />
      </div>
    </aside>
  );
}

function SidebarAction({
  icon,
  label,
  onClick,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  collapsed: boolean;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 h-7 rounded-md text-[12px] text-(--color-ink-muted) hover:bg-(--color-surface-2) hover:text-(--color-ink) transition-colors',
        collapsed && 'justify-center px-0',
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
  return collapsed ? (
    <Tooltip label={label} side="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}
