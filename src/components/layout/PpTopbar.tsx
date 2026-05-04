import { Sun, Moon, Bell, Plus, LogOut, ChevronRight, Search } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../auth/useAuth';
import { navigate } from '../../lib/router';

interface Crumb {
  label: string;
  onClick?: () => void;
}

export function PpTopbar({ crumbs }: { crumbs: Crumb[] }) {
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();

  return (
    <div className="pp-topbar">
      <div className="pp-crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={12} className="pp-chev" />}
            {i < crumbs.length - 1 && c.onClick ? (
              <button onClick={c.onClick}>{c.label}</button>
            ) : (
              <span className="pp-crumb-current">{c.label}</span>
            )}
          </span>
        ))}
      </div>
      <div className="pp-topbar-spacer" />

      {/* Theme toggle */}
      <button
        className="pp-theme-toggle"
        onClick={toggle}
        role="switch"
        aria-checked={theme === 'dark'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="pp-theme-toggle-track">
          <span className="pp-theme-toggle-icon left"><Sun size={12} /></span>
          <span className="pp-theme-toggle-icon right"><Moon size={12} /></span>
          <span className="pp-theme-toggle-thumb" aria-hidden="true">
            {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
          </span>
        </span>
      </button>

      <button className="pp-icon-btn" title="Notifications" aria-label="Notifications"><Bell size={16} /></button>
      <button className="pp-icon-btn" title="Submit project" aria-label="Submit project" onClick={() => navigate('/projects/new')}>
        <Plus size={16} />
      </button>
      <button className="pp-icon-btn" title="Sign out" aria-label="Sign out" onClick={() => void signOut()}>
        <LogOut size={16} />
      </button>

      {/* Search hint (visual only for now) */}
      <span style={{ display: 'none' }}><Search size={12} /></span>
    </div>
  );
}
