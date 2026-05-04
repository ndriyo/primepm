import { DEFAULT_CALENDAR, type Dependency, type Task } from '../engine';
import { newId } from '../lib/ids';
import type { TemplateData, TemplateDefinition } from './index';

/**
 * Procedurally generate a realistic ~400-task construction schedule:
 *  - Site-wide pre-construction (~30)
 *  - Site work + utilities (~30)
 *  - Three zones (Zone A / B / C), each ~100 tasks
 *  - Site-wide closeout (~25)
 *
 * Dependencies:
 *  - FS between consecutive task groups inside a zone phase
 *  - FS between phases inside a zone
 *  - SS+lag between zones (parallel work staggered by 5 days)
 *  - FS from preconstruction → site work → first zone phase
 */

interface TaskSpec {
  key: string;
  name: string;
  duration: number;
  parentKey?: string;
  isMilestone?: boolean;
}
interface DepSpec {
  from: string;
  to: string;
  type?: 'FS' | 'SS' | 'FF' | 'SF';
  lag?: number;
}

// ---- Building blocks ----------------------------------------------------------

const PRE_CONSTRUCTION_TASKS: Array<[string, number]> = [
  ['Owner kickoff meeting', 1],
  ['Design coordination', 4],
  ['Permit drawing set issue', 2],
  ['Submit to AHJ', 1],
  ['Plan check round 1', 12],
  ['Plan corrections', 4],
  ['Plan resubmittal', 1],
  ['Plan check round 2', 8],
  ['Building permit issued', 0],
  ['Mobilization plan', 3],
  ['Trailer setup', 2],
  ['Temporary fencing', 2],
  ['Site safety plan review', 2],
  ['Subcontractor pre-qualification', 5],
  ['Award structural contract', 3],
  ['Award MEP contracts', 5],
  ['Award envelope contract', 3],
  ['Long-lead procurement', 10],
  ['Submittal log issued', 2],
  ['Schedule baseline approval', 3],
  ['Site logistics plan', 3],
  ['Crane swing study', 2],
  ['Material laydown plan', 2],
  ['Insurance & bonding', 5],
  ['LEED kickoff', 2],
  ['Document control setup', 1],
  ['Safety orientation prep', 1],
];

const SITE_WORK_TASKS: Array<[string, number]> = [
  ['Pre-construction survey', 2],
  ['Erosion control install', 3],
  ['Tree protection', 2],
  ['Demolition existing structures', 5],
  ['Dust mitigation setup', 1],
  ['Site clearing', 4],
  ['Mass excavation', 12],
  ['Export soil offsite', 6],
  ['Rough grading', 5],
  ['Underground utilities — sanitary', 6],
  ['Underground utilities — storm', 6],
  ['Underground utilities — domestic water', 5],
  ['Underground utilities — fire main', 4],
  ['Telecom duct bank', 5],
  ['Electrical primary duct bank', 7],
  ['Site lighting bases', 3],
  ['Backfill & compaction', 5],
  ['Geotech compaction tests', 2],
  ['Temporary roads', 2],
  ['Site office trailer', 1],
  ['Crane mat install', 2],
  ['Tower crane assembly', 4],
  ['Hoist setup', 3],
  ['Site mobilization complete', 0],
  ['Survey control points set', 1],
  ['Underground inspection', 1],
  ['As-built underground', 2],
  ['Traffic control plan', 2],
];

interface ZonePhase {
  phaseKey: string;
  phaseName: string;
  tasks: Array<[string, number] | [string, number, true]>;
}

const ZONE_PHASES: ZonePhase[] = [
  {
    phaseKey: 'foundation',
    phaseName: 'Foundation',
    tasks: [
      ['Excavate footings', 4],
      ['Form footings', 3],
      ['Place footing rebar', 3],
      ['Footing inspection', 1, true],
      ['Pour footings', 2],
      ['Cure footings', 5],
      ['Form foundation walls', 4],
      ['Place wall rebar', 3],
      ['Wall electrical sleeves', 1],
      ['Wall plumbing sleeves', 1],
      ['Foundation wall pour', 2],
      ['Strip wall forms', 1],
      ['Foundation waterproofing', 3],
      ['Drain tile install', 2],
      ['Backfill foundation', 3],
      ['SOG underslab utilities', 4],
      ['SOG vapor barrier', 1],
      ['SOG rebar', 3],
      ['SOG inspection', 1],
      ['Pour slab on grade', 2],
    ],
  },
  {
    phaseKey: 'frame',
    phaseName: 'Structural Frame',
    tasks: [
      ['Steel column erect — L1', 3],
      ['Beam erect — L1', 3],
      ['Decking — L1', 2],
      ['Stud rails — L1', 1],
      ['Pour concrete — L1', 2],
      ['Steel column erect — L2', 3],
      ['Beam erect — L2', 3],
      ['Decking — L2', 2],
      ['Pour concrete — L2', 2],
      ['Steel column erect — L3', 3],
      ['Beam erect — L3', 3],
      ['Decking — L3', 2],
      ['Pour concrete — L3', 2],
      ['Roof framing', 4],
      ['Stair tower steel', 4],
      ['Stair pans', 3],
      ['Misc metals', 5],
      ['Frame inspection', 1, true],
      ['Topping out ceremony', 0, true],
    ],
  },
  {
    phaseKey: 'envelope',
    phaseName: 'Envelope',
    tasks: [
      ['Exterior framing', 8],
      ['Sheathing', 5],
      ['Air barrier', 4],
      ['Window rough openings', 3],
      ['Window install — L1', 4],
      ['Window install — L2', 4],
      ['Window install — L3', 4],
      ['Curtain wall mullions', 6],
      ['Curtain wall glazing', 8],
      ['Roof underlayment', 3],
      ['Roof membrane', 5],
      ['Roof flashing', 3],
      ['Brick veneer — L1', 5],
      ['Brick veneer — L2', 5],
      ['Brick veneer — L3', 5],
      ['Caulking & sealants', 4],
      ['Building dry-in', 0],
    ],
  },
  {
    phaseKey: 'mep_rough',
    phaseName: 'MEP Rough-in',
    tasks: [
      ['Overhead plumbing — L1', 5],
      ['Overhead plumbing — L2', 5],
      ['Overhead plumbing — L3', 5],
      ['HVAC ductwork — L1', 6],
      ['HVAC ductwork — L2', 6],
      ['HVAC ductwork — L3', 6],
      ['Sprinkler mains', 5],
      ['Sprinkler branch lines — L1', 4],
      ['Sprinkler branch lines — L2', 4],
      ['Sprinkler branch lines — L3', 4],
      ['Electrical conduit — L1', 6],
      ['Electrical conduit — L2', 6],
      ['Electrical conduit — L3', 6],
      ['Cable tray', 4],
      ['Low voltage rough', 5],
      ['Fire alarm rough', 4],
      ['Wall framing — L1', 6],
      ['Wall framing — L2', 6],
      ['Wall framing — L3', 6],
      ['In-wall plumbing — L1', 4],
      ['In-wall plumbing — L2', 4],
      ['In-wall plumbing — L3', 4],
      ['In-wall electrical — L1', 4],
      ['In-wall electrical — L2', 4],
      ['In-wall electrical — L3', 4],
      ['MEP rough inspection', 1, true],
    ],
  },
  {
    phaseKey: 'drywall',
    phaseName: 'Drywall & Paint',
    tasks: [
      ['Insulation — L1', 4],
      ['Insulation — L2', 4],
      ['Insulation — L3', 4],
      ['Drywall hang — L1', 5],
      ['Drywall hang — L2', 5],
      ['Drywall hang — L3', 5],
      ['Drywall finish — L1', 6],
      ['Drywall finish — L2', 6],
      ['Drywall finish — L3', 6],
      ['Prime paint', 5],
      ['Final paint — L1', 4],
      ['Final paint — L2', 4],
      ['Final paint — L3', 4],
    ],
  },
  {
    phaseKey: 'finishes',
    phaseName: 'Finishes',
    tasks: [
      ['Ceiling grid — L1', 4],
      ['Ceiling grid — L2', 4],
      ['Ceiling grid — L3', 4],
      ['Lights & diffusers — L1', 4],
      ['Lights & diffusers — L2', 4],
      ['Lights & diffusers — L3', 4],
      ['Tile work — wet rooms', 6],
      ['Flooring — L1', 5],
      ['Flooring — L2', 5],
      ['Flooring — L3', 5],
      ['Casework install', 5],
      ['Doors & hardware', 4],
      ['Plumbing trim out', 5],
      ['Electrical trim out', 5],
      ['HVAC trim & balance', 5],
      ['Specialties install', 4],
    ],
  },
  {
    phaseKey: 'inspection',
    phaseName: 'Inspection & Punchlist',
    tasks: [
      ['Pre-final walkthrough', 2],
      ['Punchlist generated', 1],
      ['Punchlist completion', 8],
      ['Life safety inspection', 1, true],
      ['Health department inspection', 1, true],
      ['Final building inspection', 1, true],
    ],
  },
];

const CLOSEOUT_TASKS: Array<[string, number]> = [
  ['Owner training — HVAC', 2],
  ['Owner training — electrical', 2],
  ['Owner training — life safety', 1],
  ['Test & balance final', 4],
  ['Commissioning fundamental', 5],
  ['Commissioning enhanced', 4],
  ['As-built drawings', 8],
  ['Closeout binder prep', 5],
  ['O&M manuals', 5],
  ['Warranty docs', 3],
  ['Substantial completion', 0],
  ['Owner move-in coordination', 4],
  ['Punchlist verification', 5],
  ['Final lien releases', 3],
  ['Demobilization', 5],
  ['Tower crane removal', 3],
  ['Hoist removal', 2],
  ['Site cleanup', 3],
  ['Landscaping & paving', 8],
  ['Project handover', 0],
  ['One-month warranty walk', 1],
  ['Final retainage release', 1],
];

// ---- Builder ------------------------------------------------------------------

function build(start: Date): TemplateData {
  const taskSpecs: TaskSpec[] = [];
  const depSpecs: DepSpec[] = [];

  const addPhase = (
    parentKey: string | undefined,
    phaseKey: string,
    phaseName: string,
    tasks: Array<readonly [string, number] | readonly [string, number, true]>,
    intraPhaseDeps = true,
  ): { firstKey: string; lastKey: string } => {
    taskSpecs.push({ key: phaseKey, name: phaseName, duration: 0, parentKey });
    let prev: string | null = null;
    let first: string | null = null;
    let last: string | null = null;
    tasks.forEach(([name, days, isMilestone], i) => {
      const key = `${phaseKey}_t${i}`;
      taskSpecs.push({
        key,
        name,
        duration: days,
        parentKey: phaseKey,
        isMilestone: !!isMilestone,
      });
      if (intraPhaseDeps && prev) depSpecs.push({ from: prev, to: key, type: 'FS' });
      prev = key;
      if (!first) first = key;
      last = key;
    });
    return { firstKey: first ?? phaseKey, lastKey: last ?? phaseKey };
  };

  // Site-wide root phases
  const preconstruction = addPhase(undefined, 'preconstruction', 'Pre-construction', PRE_CONSTRUCTION_TASKS);
  const sitework = addPhase(undefined, 'sitework', 'Site Work & Utilities', SITE_WORK_TASKS);
  depSpecs.push({ from: preconstruction.lastKey, to: sitework.firstKey, type: 'FS' });

  // Three zones
  const zones = [
    { key: 'zone_a', name: 'Zone A', stagger: 0 },
    { key: 'zone_b', name: 'Zone B', stagger: 8 },
    { key: 'zone_c', name: 'Zone C', stagger: 16 },
  ];

  type ZoneAccumulator = { firstFoundationKey: string; lastFinishKey: string };
  const zoneAcc = new Map<string, ZoneAccumulator>();

  for (const zone of zones) {
    taskSpecs.push({ key: zone.key, name: zone.name, duration: 0 });
    let prevPhaseLast: string | null = null;
    let firstFoundationKey = '';
    let lastPhaseLast = '';
    for (const phase of ZONE_PHASES) {
      const phaseKey = `${zone.key}_${phase.phaseKey}`;
      const { firstKey, lastKey } = addPhase(zone.key, phaseKey, phase.phaseName, phase.tasks);
      if (phase.phaseKey === 'foundation') {
        firstFoundationKey = firstKey;
      }
      if (prevPhaseLast) depSpecs.push({ from: prevPhaseLast, to: firstKey, type: 'FS' });
      prevPhaseLast = lastKey;
      lastPhaseLast = lastKey;
    }
    zoneAcc.set(zone.key, { firstFoundationKey, lastFinishKey: lastPhaseLast });
  }

  // Site work → Zone A foundation start
  const zoneA = zoneAcc.get('zone_a')!;
  depSpecs.push({ from: sitework.lastKey, to: zoneA.firstFoundationKey, type: 'FS' });

  // Zones B/C foundations start SS+stagger from Zone A foundation
  for (const zone of zones) {
    if (zone.key === 'zone_a') continue;
    const acc = zoneAcc.get(zone.key)!;
    depSpecs.push({
      from: zoneA.firstFoundationKey,
      to: acc.firstFoundationKey,
      type: 'SS',
      lag: zone.stagger,
    });
  }

  // Closeout depends on the latest zone's last task (FF — finish together)
  const closeout = addPhase(undefined, 'closeout', 'Closeout & Handover', CLOSEOUT_TASKS);
  for (const zone of zones) {
    const acc = zoneAcc.get(zone.key)!;
    depSpecs.push({ from: acc.lastFinishKey, to: closeout.firstKey, type: 'FS' });
  }

  // ---- Materialize -----------------------------------------------------------

  const tasks = new Map<string, Task>();
  const order: string[] = [];
  const keyToId = new Map<string, string>();

  for (const spec of taskSpecs) {
    const id = newId('tsk');
    keyToId.set(spec.key, id);
    tasks.set(id, {
      id,
      name: spec.name,
      durationDays: spec.duration,
      scheduleMode: 'auto',
      constraint: { kind: 'ASAP' },
      isMilestone: !!spec.isMilestone || spec.duration === 0,
      progressPct: 0,
      parentId: spec.parentKey ? keyToId.get(spec.parentKey) : undefined,
    });
    order.push(id);
  }

  const dependencies = new Map<string, Dependency>();
  for (const dep of depSpecs) {
    const id = newId('dep');
    const predecessorId = keyToId.get(dep.from);
    const successorId = keyToId.get(dep.to);
    if (!predecessorId || !successorId) continue;
    dependencies.set(id, {
      id,
      predecessorId,
      successorId,
      type: dep.type ?? 'FS',
      lagDays: dep.lag ?? 0,
    });
  }

  return {
    project: { id: newId('prj'), name: 'Construction (Mega)', start },
    tasks,
    taskOrder: order,
    dependencies,
    calendar: DEFAULT_CALENDAR,
  };
}

export const CONSTRUCTION_MEGA: TemplateDefinition = {
  id: 'construction-mega',
  title: 'Construction (Mega)',
  subtitle: '~400-task multi-zone build',
  emoji: '🏢',
  accent: 'amber',
  build,
};

/**
 * Stress-test template that programmatically scales the construction build to
 * any task count by repeating zones. Each zone adds ~135 tasks.
 * 30 (preconstruction) + 28 (site work) + N×135 + 22 (closeout)
 *   1 zone  → 215      4 zones → 620
 *   8 zones → 1160    16 zones → 2240
 *  30 zones → 4130    60 zones → 8180
 */
export function buildStressSchedule(targetTaskCount: number): TemplateData {
  const start = nextMonday();
  const SITE_WIDE = 30 + 28 + 22; // pre + site work + closeout = ~80
  const PER_ZONE = 135;
  const zones = Math.max(1, Math.round((targetTaskCount - SITE_WIDE) / PER_ZONE));
  return buildScaled(start, zones);
}

function nextMonday(): Date {
  const now = new Date();
  const dow = now.getDay();
  const offset = dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

function buildScaled(start: Date, zoneCount: number): TemplateData {
  const taskSpecs: TaskSpec[] = [];
  const depSpecs: DepSpec[] = [];

  const addPhase = (
    parentKey: string | undefined,
    phaseKey: string,
    phaseName: string,
    tasks: Array<readonly [string, number] | readonly [string, number, true]>,
  ): { firstKey: string; lastKey: string } => {
    taskSpecs.push({ key: phaseKey, name: phaseName, duration: 0, parentKey });
    let prev: string | null = null;
    let first: string | null = null;
    let last: string | null = null;
    tasks.forEach(([name, days, isMilestone], i) => {
      const key = `${phaseKey}_t${i}`;
      taskSpecs.push({
        key,
        name,
        duration: days,
        parentKey: phaseKey,
        isMilestone: !!isMilestone,
      });
      if (prev) depSpecs.push({ from: prev, to: key, type: 'FS' });
      prev = key;
      if (!first) first = key;
      last = key;
    });
    return { firstKey: first ?? phaseKey, lastKey: last ?? phaseKey };
  };

  const pre = addPhase(undefined, 'preconstruction', 'Pre-construction', PRE_CONSTRUCTION_TASKS);
  const sw = addPhase(undefined, 'sitework', 'Site Work & Utilities', SITE_WORK_TASKS);
  depSpecs.push({ from: pre.lastKey, to: sw.firstKey, type: 'FS' });

  let firstFoundationOfZone0 = '';
  const zoneLasts: string[] = [];
  for (let z = 0; z < zoneCount; z++) {
    const zoneKey = `z${z}`;
    taskSpecs.push({ key: zoneKey, name: `Zone ${z + 1}`, duration: 0 });
    let prevPhaseLast: string | null = null;
    for (const phase of ZONE_PHASES) {
      const phaseKey = `${zoneKey}_${phase.phaseKey}`;
      const { firstKey, lastKey } = addPhase(zoneKey, phaseKey, phase.phaseName, phase.tasks);
      if (z === 0 && phase.phaseKey === 'foundation') firstFoundationOfZone0 = firstKey;
      if (prevPhaseLast) depSpecs.push({ from: prevPhaseLast, to: firstKey, type: 'FS' });
      prevPhaseLast = lastKey;
    }
    zoneLasts.push(prevPhaseLast ?? zoneKey);
    if (z === 0) {
      depSpecs.push({ from: sw.lastKey, to: firstFoundationOfZone0, type: 'FS' });
    } else {
      depSpecs.push({
        from: firstFoundationOfZone0,
        to: `${zoneKey}_foundation_t0`,
        type: 'SS',
        lag: z * 5,
      });
    }
  }

  const close = addPhase(undefined, 'closeout', 'Closeout & Handover', CLOSEOUT_TASKS);
  for (const last of zoneLasts) depSpecs.push({ from: last, to: close.firstKey, type: 'FS' });

  // Materialize
  const tasks = new Map<string, Task>();
  const order: string[] = [];
  const keyToId = new Map<string, string>();
  for (const spec of taskSpecs) {
    const id = newId('tsk');
    keyToId.set(spec.key, id);
    tasks.set(id, {
      id,
      name: spec.name,
      durationDays: spec.duration,
      scheduleMode: 'auto',
      constraint: { kind: 'ASAP' },
      isMilestone: !!spec.isMilestone || spec.duration === 0,
      progressPct: 0,
      parentId: spec.parentKey ? keyToId.get(spec.parentKey) : undefined,
    });
    order.push(id);
  }
  const dependencies = new Map<string, Dependency>();
  for (const dep of depSpecs) {
    const id = newId('dep');
    const predId = keyToId.get(dep.from);
    const succId = keyToId.get(dep.to);
    if (!predId || !succId) continue;
    dependencies.set(id, {
      id,
      predecessorId: predId,
      successorId: succId,
      type: dep.type ?? 'FS',
      lagDays: dep.lag ?? 0,
    });
  }
  return {
    project: { id: newId('prj'), name: `Stress Test (${tasks.size} tasks)`, start },
    tasks,
    taskOrder: order,
    dependencies,
    calendar: DEFAULT_CALENDAR,
  };
}
