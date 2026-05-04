import { useEffect, useState } from 'react';

/**
 * Tiny path-based router for PrimePM.
 *   /login                → login / signup
 *   /dashboard            → real dashboard
 *   /dashboard-soon       → full mock dashboard
 *   /projects             → real ongoing-project list
 *   /projects/new         → submission wizard
 *   /projects/:id         → real project detail (with Schedule button → /p/:id)
 *   /projects/:id/edit    → edit project (full submission)
 *   /selection            → criteria/AHP management
 *   /ongoing-soon         → mock ongoing-project list
 *   /ongoing-soon/:id     → mock project detail
 *   /soon/:kind           → generic soon placeholder page
 *   /p/:uuid              → scheduler for a project
 */

export type SoonKind =
  | 'portfolio' | 'programs' | 'objectives' | 'risks' | 'dependencies'
  | 'benefits' | 'exec-briefing' | 'steering' | 'stage-gate';

export type Route =
  | { name: 'login' }
  | { name: 'list' }                              // /projects
  | { name: 'project-detail'; id: string }        // /projects/:id
  | { name: 'project-edit'; id: string }          // /projects/:id/edit
  | { name: 'dashboard' }                         // /dashboard
  | { name: 'dashboard-soon' }                    // /dashboard-soon
  | { name: 'submission' }                        // /projects/new
  | { name: 'selection' }                         // /selection
  | { name: 'ongoing-soon' }                      // /ongoing-soon
  | { name: 'ongoing-soon-detail'; id: string }   // /ongoing-soon/:id
  | { name: 'soon'; kind: SoonKind }              // /soon/:kind
  | { name: 'project'; id: string }               // /p/:uuid (scheduler)
  | { name: 'unknown' };

const UUID_RE = /^[0-9a-f-]{36}$/i;

function parsePath(pathname: string): Route {
  if (pathname === '/login' || pathname === '/login/') return { name: 'login' };
  if (pathname === '/dashboard' || pathname === '/dashboard/') return { name: 'dashboard' };
  if (pathname === '/dashboard-soon' || pathname === '/dashboard-soon/') return { name: 'dashboard-soon' };
  if (pathname === '/projects' || pathname === '/projects/') return { name: 'list' };
  if (pathname === '/projects/new' || pathname === '/projects/new/') return { name: 'submission' };
  if (pathname === '/selection' || pathname === '/selection/') return { name: 'selection' };
  if (pathname === '/ongoing-soon' || pathname === '/ongoing-soon/') return { name: 'ongoing-soon' };

  // /soon/:kind
  const sm = pathname.match(/^\/soon\/([\w-]+)\/?$/);
  if (sm) {
    const kind = sm[1];
    const valid: SoonKind[] = ['portfolio', 'programs', 'objectives', 'risks', 'dependencies', 'benefits', 'exec-briefing', 'steering', 'stage-gate'];
    if ((valid as string[]).includes(kind)) {
      return { name: 'soon', kind: kind as SoonKind };
    }
  }

  // /ongoing-soon/:id (any string id since mock)
  const om = pathname.match(/^\/ongoing-soon\/([^/]+)\/?$/);
  if (om) return { name: 'ongoing-soon-detail', id: om[1] };

  // /projects/:id/edit
  const pe = pathname.match(/^\/projects\/([0-9a-f-]{36})\/edit\/?$/i);
  if (pe) return { name: 'project-edit', id: pe[1] };

  // /projects/:id
  const pd = pathname.match(/^\/projects\/([0-9a-f-]{36})\/?$/i);
  if (pd) return { name: 'project-detail', id: pd[1] };

  // /p/:uuid
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

// re-export for callers
export { UUID_RE };
