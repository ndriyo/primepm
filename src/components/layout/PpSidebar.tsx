import {
  PlayCircle,
  Clipboard,
  Send,
  Home,
  Folder,
  Layers,
  Target,
  AlertTriangle,
  Link2,
  DollarSign,
  TrendingUp,
  Gauge,
  Calendar,
  Settings,
} from 'lucide-react';
import { useRoute, navigate, type Route } from '../../lib/router';
import { useAuth } from '../../auth/useAuth';
import { Avatar } from '../Avatar';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  match?: (r: Route) => boolean;
  badge?: number | string;
  soon?: boolean;
  onClick?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function SidebarNavBlock({ section, route }: { section: NavSection; route: Route }) {
  return (
    <>
      <div className="pp-sidebar-section">{section.title}</div>
      <nav className="pp-sidebar-nav">
        {section.items.map((item, idx) => {
          const active = item.match ? item.match(route) : false;
          return (
            <button
              key={idx}
              type="button"
              className="pp-nav-item"
              aria-current={active ? 'true' : undefined}
              onClick={item.onClick ?? (item.path ? () => navigate(item.path!) : undefined)}
            >
              <span className="pp-ico">{item.icon}</span>
              <span>{item.label}</span>
              {item.soon && <span className="pp-soon">Soon</span>}
              {item.badge != null && !item.soon && (
                <span className="pp-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

export function PpSidebar({ projectCount = 0 }: { projectCount?: number }) {
  const route = useRoute();
  const { session } = useAuth();

  const userMeta = (session?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const userName =
    (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
    (typeof userMeta.name === 'string' && userMeta.name) ||
    null;
  const userAvatar =
    (typeof userMeta.avatar_url === 'string' && userMeta.avatar_url) ||
    (typeof userMeta.picture === 'string' && userMeta.picture) ||
    null;
  const userEmail = session?.user?.email ?? null;

  const sections: NavSection[] = [
    {
      title: 'Projects',
      items: [
        {
          label: 'Ongoing Project',
          icon: <PlayCircle size={16} />,
          path: '/projects',
          match: r => r.name === 'list' || r.name === 'project-detail',
          badge: projectCount,
        },
        {
          label: 'Ongoing Project',
          icon: <PlayCircle size={16} />,
          path: '/ongoing-soon',
          match: r => r.name === 'ongoing-soon' || r.name === 'ongoing-soon-detail',
          soon: true,
        },
        {
          label: 'Project Selection',
          icon: <Clipboard size={16} />,
          path: '/selection',
          match: r => r.name === 'selection',
        },
        {
          label: 'Project Submission',
          icon: <Send size={16} />,
          path: '/projects/new',
          match: r => r.name === 'submission',
        },
      ],
    },
    {
      title: 'Workspace',
      items: [
        {
          label: 'Dashboard',
          icon: <Home size={16} />,
          path: '/dashboard',
          match: r => r.name === 'dashboard',
        },
        {
          label: 'Dashboard',
          icon: <Home size={16} />,
          path: '/dashboard-soon',
          match: r => r.name === 'dashboard-soon',
          soon: true,
        },
        { label: 'Portfolio', icon: <Folder size={16} />, path: '/soon/portfolio', soon: true,
          match: r => r.name === 'soon' && r.kind === 'portfolio' },
        { label: 'Programs', icon: <Layers size={16} />, path: '/soon/programs', soon: true,
          match: r => r.name === 'soon' && r.kind === 'programs' },
        { label: 'Objectives', icon: <Target size={16} />, path: '/soon/objectives', soon: true,
          match: r => r.name === 'soon' && r.kind === 'objectives' },
        { label: 'Risks & Issues', icon: <AlertTriangle size={16} />, path: '/soon/risks', soon: true,
          match: r => r.name === 'soon' && r.kind === 'risks' },
        { label: 'Dependencies', icon: <Link2 size={16} />, path: '/soon/dependencies', soon: true,
          match: r => r.name === 'soon' && r.kind === 'dependencies' },
        { label: 'Benefits & ROI', icon: <DollarSign size={16} />, path: '/soon/benefits', soon: true,
          match: r => r.name === 'soon' && r.kind === 'benefits' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { label: 'Executive briefing', icon: <TrendingUp size={16} />, path: '/soon/exec-briefing', soon: true,
          match: r => r.name === 'soon' && r.kind === 'exec-briefing' },
        { label: 'Steering committee', icon: <Gauge size={16} />, path: '/soon/steering', soon: true,
          match: r => r.name === 'soon' && r.kind === 'steering' },
        { label: 'Stage-gate calendar', icon: <Calendar size={16} />, path: '/soon/stage-gate', soon: true,
          match: r => r.name === 'soon' && r.kind === 'stage-gate' },
      ],
    },
  ];

  return (
    <aside className="pp-sidebar">
      <div className="pp-sidebar-brand">
        <div className="pp-brand-mark">P</div>
        <div className="pp-brand-name">PrimePM<em>·pmo</em></div>
      </div>

      {sections.map((s, i) => <SidebarNavBlock key={i} section={s} route={route} />)}

      <div className="pp-sidebar-foot">
        <Avatar url={userAvatar} name={userName} email={userEmail} size={28} />
        <div className="pp-avatar-meta">
          <strong>{userName ?? userEmail?.split('@')[0] ?? 'You'}</strong>
          <span>PMO</span>
        </div>
        <button className="pp-icon-btn" style={{ marginLeft: 'auto' }} title="Settings">
          <Settings size={14} />
        </button>
      </div>
    </aside>
  );
}
