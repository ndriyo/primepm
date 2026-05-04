/**
 * Core scheduling domain — pure TypeScript, no React.
 * The engine never imports outside this folder.
 */

export type DepType = 'FS' | 'SS' | 'FF' | 'SF';

export type ScheduleMode = 'auto' | 'manual';

export type ConstraintKind =
  | 'ASAP' // As Soon As Possible (default)
  | 'SNET' // Start No Earlier Than
  | 'FNET' // Finish No Earlier Than
  | 'MSO' // Must Start On
  | 'MFO'; // Must Finish On

export type Constraint =
  | { kind: 'ASAP' }
  | { kind: 'SNET'; date: Date }
  | { kind: 'FNET'; date: Date }
  | { kind: 'MSO'; date: Date }
  | { kind: 'MFO'; date: Date };

export interface Task {
  id: string;
  name: string;
  /** Working days. 0 means milestone. */
  durationDays: number;
  /** Anchor date when scheduleMode === 'manual'. */
  manualStart?: Date;
  scheduleMode: ScheduleMode;
  constraint: Constraint;
  /** Parent summary task. Children determine summary span. */
  parentId?: string;
  isMilestone: boolean;
  progressPct: number; // 0..100
  color?: string;
  notes?: string;
}

export interface Dependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DepType;
  /** Lag in working days. Negative = lead. */
  lagDays: number;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Calendar {
  workingDaysOfWeek: Set<DayOfWeek>;
  /** ISO date strings (YYYY-MM-DD) of non-working days. */
  holidays: Set<string>;
  hoursPerDay: number;
}

export interface ScheduledTask {
  id: string;
  start: Date;
  finish: Date;
  /** Float in working days (LS - ES). 0 ⇒ critical. */
  slack: number;
  /** True if this task is on the critical path. */
  isCritical: boolean;
  /** True if part of a cycle and could not be scheduled. */
  inCycle: boolean;
}

export interface ScheduleResult {
  scheduled: Map<string, ScheduledTask>;
  cycles: string[][];
  criticalPath: Set<string>;
  projectStart: Date;
  projectFinish: Date;
}

export const DEFAULT_CALENDAR: Calendar = {
  workingDaysOfWeek: new Set<DayOfWeek>([1, 2, 3, 4, 5]),
  holidays: new Set<string>(),
  hoursPerDay: 8,
};
