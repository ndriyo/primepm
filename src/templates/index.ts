import { DEFAULT_CALENDAR, type Dependency, type Task } from '../engine';
import { newId } from '../lib/ids';
import type { ProjectMeta } from '../store/projectStore';
import { CONSTRUCTION_MEGA } from './constructionMega';

export interface TemplateDefinition {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string; // tailwind color name for the card border
  build: (start: Date) => TemplateData;
}

export interface TemplateData {
  project: ProjectMeta;
  tasks: Map<string, Task>;
  taskOrder: string[];
  dependencies: Map<string, Dependency>;
  calendar: typeof DEFAULT_CALENDAR;
}

interface TaskSpec {
  key: string;
  name: string;
  duration: number;
  parent?: string;
  isMilestone?: boolean;
}
interface DepSpec {
  from: string;
  to: string;
  type?: 'FS' | 'SS' | 'FF' | 'SF';
  lag?: number;
}

function build(name: string, start: Date, taskSpecs: TaskSpec[], depSpecs: DepSpec[]): TemplateData {
  const tasks = new Map<string, Task>();
  const order: string[] = [];
  const keyToId = new Map<string, string>();
  for (const spec of taskSpecs) {
    const id = newId('tsk');
    keyToId.set(spec.key, id);
    const task: Task = {
      id,
      name: spec.name,
      durationDays: spec.duration,
      scheduleMode: 'auto',
      constraint: { kind: 'ASAP' },
      isMilestone: !!spec.isMilestone || spec.duration === 0,
      progressPct: 0,
      parentId: spec.parent ? keyToId.get(spec.parent) : undefined,
    };
    tasks.set(id, task);
    order.push(id);
  }
  const dependencies = new Map<string, Dependency>();
  for (const dep of depSpecs) {
    const depId = newId('dep');
    const predecessorId = keyToId.get(dep.from);
    const successorId = keyToId.get(dep.to);
    if (!predecessorId || !successorId) continue;
    dependencies.set(depId, {
      id: depId,
      predecessorId,
      successorId,
      type: dep.type ?? 'FS',
      lagDays: dep.lag ?? 0,
    });
  }
  return {
    project: { id: newId('prj'), name, start },
    tasks,
    taskOrder: order,
    dependencies,
    calendar: DEFAULT_CALENDAR,
  };
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'product-launch',
    title: 'Product Launch',
    subtitle: 'Discovery → Build → Launch in 8 weeks',
    emoji: '🚀',
    accent: 'sky',
    build: start =>
      build(
        'Product Launch',
        start,
        [
          { key: 'p_discover', name: 'Discovery', duration: 0 },
          { key: 'research', name: 'User research', duration: 5, parent: 'p_discover' },
          { key: 'spec', name: 'Product spec', duration: 4, parent: 'p_discover' },
          { key: 'design_review', name: 'Design review', duration: 1, parent: 'p_discover', isMilestone: true },

          { key: 'p_build', name: 'Build', duration: 0 },
          { key: 'design', name: 'UX design', duration: 7, parent: 'p_build' },
          { key: 'frontend', name: 'Frontend', duration: 10, parent: 'p_build' },
          { key: 'backend', name: 'Backend', duration: 10, parent: 'p_build' },
          { key: 'qa', name: 'QA & polish', duration: 5, parent: 'p_build' },

          { key: 'p_launch', name: 'Launch', duration: 0 },
          { key: 'beta', name: 'Beta release', duration: 3, parent: 'p_launch' },
          { key: 'marketing', name: 'Marketing prep', duration: 4, parent: 'p_launch' },
          { key: 'go_live', name: 'Go live', duration: 0, parent: 'p_launch', isMilestone: true },
        ],
        [
          { from: 'research', to: 'spec', type: 'FS' },
          { from: 'research', to: 'design', type: 'SS', lag: 2 },
          { from: 'spec', to: 'design_review', type: 'FS' },
          { from: 'design', to: 'design_review', type: 'FS' },
          { from: 'design_review', to: 'frontend', type: 'FS' },
          { from: 'design_review', to: 'backend', type: 'FS' },
          { from: 'frontend', to: 'qa', type: 'FS' },
          { from: 'backend', to: 'qa', type: 'FF' },
          { from: 'qa', to: 'beta', type: 'FS' },
          { from: 'beta', to: 'marketing', type: 'SS', lag: 1 },
          { from: 'beta', to: 'go_live', type: 'FS' },
          { from: 'marketing', to: 'go_live', type: 'FS' },
        ],
      ),
  },
  {
    id: 'marketing-campaign',
    title: 'Marketing Campaign',
    subtitle: 'Strategy → Creative → Launch',
    emoji: '📣',
    accent: 'fuchsia',
    build: start =>
      build(
        'Marketing Campaign',
        start,
        [
          { key: 'strategy', name: 'Brief & strategy', duration: 3 },
          { key: 'audience', name: 'Audience research', duration: 4 },
          { key: 'creative', name: 'Creative concept', duration: 5 },
          { key: 'copy', name: 'Copywriting', duration: 4 },
          { key: 'design_assets', name: 'Design assets', duration: 6 },
          { key: 'video', name: 'Video production', duration: 8 },
          { key: 'review', name: 'Stakeholder review', duration: 2, isMilestone: false },
          { key: 'media', name: 'Media buy', duration: 3 },
          { key: 'launch_marketing', name: 'Campaign launch', duration: 0, isMilestone: true },
          { key: 'measure', name: 'Measure & report', duration: 5 },
        ],
        [
          { from: 'strategy', to: 'audience', type: 'FS' },
          { from: 'strategy', to: 'creative', type: 'FS' },
          { from: 'audience', to: 'creative', type: 'SS', lag: 1 },
          { from: 'creative', to: 'copy', type: 'FS' },
          { from: 'creative', to: 'design_assets', type: 'FS' },
          { from: 'creative', to: 'video', type: 'FS' },
          { from: 'copy', to: 'review', type: 'FS' },
          { from: 'design_assets', to: 'review', type: 'FF' },
          { from: 'video', to: 'review', type: 'FF' },
          { from: 'review', to: 'media', type: 'FS' },
          { from: 'media', to: 'launch_marketing', type: 'FS' },
          { from: 'launch_marketing', to: 'measure', type: 'SS', lag: 1 },
        ],
      ),
  },
  {
    id: 'construction-phase',
    title: 'Construction Phase',
    subtitle: 'Foundation → Frame → Finish',
    emoji: '🏗️',
    accent: 'amber',
    build: start =>
      build(
        'Construction Phase',
        start,
        [
          { key: 'permits', name: 'Permits & approvals', duration: 10 },
          { key: 'site_prep', name: 'Site preparation', duration: 4 },
          { key: 'foundation', name: 'Foundation pour', duration: 5 },
          { key: 'cure', name: 'Foundation cure', duration: 7 },
          { key: 'framing', name: 'Framing', duration: 8 },
          { key: 'roof', name: 'Roofing', duration: 4 },
          { key: 'electrical', name: 'Electrical rough-in', duration: 5 },
          { key: 'plumbing', name: 'Plumbing rough-in', duration: 5 },
          { key: 'inspection_rough', name: 'Rough inspection', duration: 1, isMilestone: true },
          { key: 'drywall', name: 'Drywall', duration: 6 },
          { key: 'finish', name: 'Finish work', duration: 8 },
          { key: 'handover', name: 'Handover', duration: 0, isMilestone: true },
        ],
        [
          { from: 'permits', to: 'site_prep', type: 'FS' },
          { from: 'site_prep', to: 'foundation', type: 'FS' },
          { from: 'foundation', to: 'cure', type: 'FS' },
          { from: 'cure', to: 'framing', type: 'FS' },
          { from: 'framing', to: 'roof', type: 'FS' },
          { from: 'framing', to: 'electrical', type: 'SS', lag: 3 },
          { from: 'framing', to: 'plumbing', type: 'SS', lag: 3 },
          { from: 'electrical', to: 'inspection_rough', type: 'FS' },
          { from: 'plumbing', to: 'inspection_rough', type: 'FS' },
          { from: 'roof', to: 'inspection_rough', type: 'FS' },
          { from: 'inspection_rough', to: 'drywall', type: 'FS' },
          { from: 'drywall', to: 'finish', type: 'FS' },
          { from: 'finish', to: 'handover', type: 'FS' },
        ],
      ),
  },
  CONSTRUCTION_MEGA,
  {
    id: 'event-planning',
    title: 'Event Planning',
    subtitle: 'Wedding-grade planning timeline',
    emoji: '🎉',
    accent: 'rose',
    build: start =>
      build(
        'Event Planning',
        start,
        [
          { key: 'venue', name: 'Book venue', duration: 5 },
          { key: 'vendors', name: 'Confirm vendors', duration: 6 },
          { key: 'invites', name: 'Send invitations', duration: 2 },
          { key: 'rsvp', name: 'Collect RSVPs', duration: 14 },
          { key: 'menu', name: 'Finalize menu', duration: 3 },
          { key: 'seating', name: 'Seating plan', duration: 2 },
          { key: 'rehearsal', name: 'Rehearsal', duration: 1, isMilestone: false },
          { key: 'event_day', name: 'Event day', duration: 0, isMilestone: true },
          { key: 'thanks', name: 'Thank-you cards', duration: 3 },
        ],
        [
          { from: 'venue', to: 'vendors', type: 'FS' },
          { from: 'vendors', to: 'invites', type: 'FS' },
          { from: 'invites', to: 'rsvp', type: 'SS', lag: 1 },
          { from: 'rsvp', to: 'menu', type: 'FF', lag: -3 },
          { from: 'menu', to: 'seating', type: 'FS' },
          { from: 'seating', to: 'rehearsal', type: 'FS' },
          { from: 'rehearsal', to: 'event_day', type: 'FS' },
          { from: 'event_day', to: 'thanks', type: 'FS' },
        ],
      ),
  },
];

export const BLANK_TEMPLATE: TemplateDefinition = {
  id: 'blank',
  title: 'Start blank',
  subtitle: 'Fresh canvas. No tasks.',
  emoji: '✨',
  accent: 'zinc',
  build: start => ({
    project: { id: newId('prj'), name: 'New Project', start },
    tasks: new Map(),
    taskOrder: [],
    dependencies: new Map(),
    calendar: DEFAULT_CALENDAR,
  }),
};
