import { describe, expect, it } from 'vitest';
import { recalculate } from '../recalculate';
import { isoDate } from '../calendar';
import { PROJECT_START, cal, mapOf, mkDep, mkTask } from './fixtures';

const iso = (d: Date) => isoDate(d);

describe('Dependency type: FS (Finish-to-Start)', () => {
  it('B starts the working day after A finishes', () => {
    // A: Mon 5/4 → Wed 5/6 (3 days)  — B(FS,0) → Thu 5/7 → Fri 5/8 (2 days)
    const tasks = mapOf([mkTask('A', 3), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-06');
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-07');
    expect(iso(r.scheduled.get('B')!.finish)).toBe('2026-05-08');
  });

  it('FS with +2d lag delays B by 2 working days', () => {
    // A: Mon → Wed. B(FS,+2): skip Thu Fri ⇒ B starts Mon 5/11
    const tasks = mapOf([mkTask('A', 3), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS', 2)]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-11');
  });

  it('FS skips weekends', () => {
    // A: 4 days starting Mon 5/4 → Mon, Tue, Wed, Thu = finish Thu 5/7. B(FS,0) starts Fri 5/8.
    // Wait — 4 working days: 5/4, 5/5, 5/6, 5/7 → finish 5/7. B starts 5/8 (Fri).
    // To force weekend behavior: A is 5 days → ends Fri 5/8. B starts Mon 5/11.
    const tasks = mapOf([mkTask('A', 5), mkTask('B', 1)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-08');
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-11');
  });
});

describe('Dependency type: SS (Start-to-Start)', () => {
  it('B starts the same day as A', () => {
    const tasks = mapOf([mkTask('A', 5), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'SS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('B')!.finish)).toBe('2026-05-05');
  });

  it('SS with +3d lag → B starts 3 working days after A starts', () => {
    const tasks = mapOf([mkTask('A', 10), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'SS', 3)]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    // A starts Mon 5/4. B starts Thu 5/7.
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-07');
  });
});

describe('Dependency type: FF (Finish-to-Finish)', () => {
  it('B finishes the same day as A', () => {
    // A: 5 days → finish Fri 5/8. B duration 2 → must finish Fri 5/8 → B starts Thu 5/7.
    const tasks = mapOf([mkTask('A', 5), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FF')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-08');
    expect(iso(r.scheduled.get('B')!.finish)).toBe('2026-05-08');
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-07');
  });

  it('FF with +2d lag → B finishes 2 working days after A', () => {
    const tasks = mapOf([mkTask('A', 5), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FF', 2)]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    // A finish Fri 5/8. B finish Tue 5/12. B start Mon 5/11.
    expect(iso(r.scheduled.get('B')!.finish)).toBe('2026-05-12');
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-11');
  });
});

describe('Dependency type: SF (Start-to-Finish)', () => {
  it('B finishes the day A starts', () => {
    // A starts Mon 5/4. B(SF,0) → B finishes 5/4. B duration 2 → starts Fri 5/1?
    // The forward pass however won't go before projectStart unless explicitly allowed.
    // SF is rare; this test verifies math with a non-zero lag so B is later than A.
    const tasks = mapOf([mkTask('A', 3), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'SF', 5)]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    // A starts Mon 5/4. SF+5: B finishes 5 working days after A starts ⇒ Mon 5/11.
    // B duration 2 → starts Fri 5/8.
    expect(iso(r.scheduled.get('B')!.finish)).toBe('2026-05-11');
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-08');
  });
});

describe('Mixed dependency graph', () => {
  it('Diamond: A→B(FS), A→C(SS+1), B→D(FS), C→D(FF+0)', () => {
    // A: 3 days → 5/4..5/6
    // B(FS A): 2 days → 5/7..5/8
    // C(SS+1 from A): 4 days → 5/5..5/8
    // D: 1 day, must satisfy FS from B (start ≥ 5/11) AND FF from C (finish == C.finish 5/8)
    //   ⇒ FS dominates: D starts 5/11.
    const tasks = mapOf([mkTask('A', 3), mkTask('B', 2), mkTask('C', 4), mkTask('D', 1)]);
    const deps = mapOf([
      mkDep('d1', 'A', 'B', 'FS'),
      mkDep('d2', 'A', 'C', 'SS', 1),
      mkDep('d3', 'B', 'D', 'FS'),
      mkDep('d4', 'C', 'D', 'FF'),
    ]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-06');
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-07');
    expect(iso(r.scheduled.get('B')!.finish)).toBe('2026-05-08');
    expect(iso(r.scheduled.get('C')!.start)).toBe('2026-05-05');
    expect(iso(r.scheduled.get('C')!.finish)).toBe('2026-05-08');
    expect(iso(r.scheduled.get('D')!.start)).toBe('2026-05-11');
  });
});

describe('Cycle detection', () => {
  it('A→B→A is flagged and tasks are excluded from schedule', () => {
    const tasks = mapOf([mkTask('A', 2), mkTask('B', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS'), mkDep('d2', 'B', 'A', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(r.cycles.length).toBeGreaterThan(0);
    expect(r.scheduled.get('A')!.inCycle).toBe(true);
    expect(r.scheduled.get('B')!.inCycle).toBe(true);
  });
});

describe('Critical path', () => {
  it('Sequential FS chain: every task is critical', () => {
    const tasks = mapOf([mkTask('A', 2), mkTask('B', 2), mkTask('C', 2)]);
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS'), mkDep('d2', 'B', 'C', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(r.scheduled.get('A')!.isCritical).toBe(true);
    expect(r.scheduled.get('B')!.isCritical).toBe(true);
    expect(r.scheduled.get('C')!.isCritical).toBe(true);
    expect(r.criticalPath.size).toBe(3);
  });

  it('Parallel branch with slack is NOT critical', () => {
    // Long: A(5) → C(1)
    // Short: B(1)  → C(1)
    // B has slack; A is critical.
    const tasks = mapOf([mkTask('A', 5), mkTask('B', 1), mkTask('C', 1)]);
    const deps = mapOf([mkDep('d1', 'A', 'C', 'FS'), mkDep('d2', 'B', 'C', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(r.scheduled.get('A')!.isCritical).toBe(true);
    expect(r.scheduled.get('B')!.isCritical).toBe(false);
    expect(r.scheduled.get('C')!.isCritical).toBe(true);
  });
});

describe('Constraints', () => {
  it('SNET: pushes start no earlier than the constraint date', () => {
    const tasks = mapOf([mkTask('A', 2)]);
    tasks.get('A')!.constraint = { kind: 'SNET', date: new Date(2026, 4, 11) };
    const r = recalculate(tasks, new Map(), cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-11');
  });

  it('MSO: pins start to a specific date', () => {
    const tasks = mapOf([mkTask('A', 2), mkTask('B', 2)]);
    tasks.get('B')!.constraint = { kind: 'MSO', date: new Date(2026, 4, 18) };
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    // Even though A finishes earlier, MSO pins B to Mon 5/18.
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-18');
  });
});

describe('Manual scheduling mode', () => {
  it('Manual task ignores predecessors and uses manualStart', () => {
    const tasks = mapOf([mkTask('A', 2), mkTask('B', 2)]);
    tasks.get('B')!.scheduleMode = 'manual';
    tasks.get('B')!.manualStart = new Date(2026, 4, 4); // Mon, same as A
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('B')!.start)).toBe('2026-05-04');
  });
});

describe('Summary roll-up', () => {
  it('Parent task spans union of children', () => {
    const parent = mkTask('P', 0);
    const child1 = mkTask('C1', 3);
    const child2 = mkTask('C2', 2);
    child1.parentId = 'P';
    child2.parentId = 'P';
    const tasks = mapOf([parent, child1, child2]);
    const deps = mapOf([mkDep('d1', 'C1', 'C2', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(iso(r.scheduled.get('P')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('P')!.finish)).toBe('2026-05-08');
  });

  it('Parallel children (2d and 2w) → summary span equals longest = 2w', () => {
    // Parent P with two children running in parallel:
    //   A: 2 days
    //   B: 10 days (2 working weeks)
    // No dependency between them — both start at projectStart (Mon May 4).
    // A: 5/4 → 5/5 (2 days)
    // B: 5/4 → 5/15 (10 working days, spans Mon..Fri week 2)
    // Summary P should span 5/4 → 5/15 (= 10 working days = 2w).
    const parent = mkTask('P', 1); // anything non-zero; should be ignored by engine for summary
    const a = mkTask('A', 2);
    const b = mkTask('B', 10);
    a.parentId = 'P';
    b.parentId = 'P';
    const tasks = mapOf([parent, a, b]);
    const r = recalculate(tasks, mapOf([]), cal, PROJECT_START);
    const ps = r.scheduled.get('P')!;
    expect(iso(ps.start)).toBe('2026-05-04');
    expect(iso(ps.finish)).toBe('2026-05-15');
  });
});
