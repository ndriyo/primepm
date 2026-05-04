import { useEffect, useState } from 'react';

/**
 * Tiny path-based router for PrimePM.
 *   /login             → login / signup
 *   /projects          → project list ("Ongoing Project")
 *   /dashboard         → metrics dashboard
 *   /projects/new      → submission wizard
 *   /selection         → criteria/AHP management
 *   /p/:uuid           → scheduler for a project
 */

export type Route =
  | { name: 'login' }
  | { name: 'list' }
  | { name: 'dashboard' }
  | { name: 'submission' }
  | { name: 'selection' }
  | { name: 'project'; id: string }
  | { name: 'unknown' };

function parsePath(pathname: string): Route {
  if (pathname === '/login' || pathname === '/login/') return { name: 'login' };
  if (pathname === '/projects' || pathname === '/projects/') return { name: 'list' };
  if (pathname === '/dashboard' || pathname === '/dashboard/') return { name: 'dashboard' };
  if (pathname === '/projects/new' || pathname === '/projects/new/') return { name: 'submission' };
  if (pathname === '/selection' || pathname === '/selection/') return { name: 'selection' };
  const m = pathname.match(/^\/p\/([0-9a-f-]{36})\/?$/i);
  if (m) return { name: 'project', id: m[1] };
  return { name: 'unknown' };
}

export function navigate(path: string): void {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname));
  useEffect(() => {
    const onChange = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return route;
}
