/**
 * Spec 002 — type-level drift guard for the baselines DTOs.
 *
 * Mirror of the OpenAPI examples from
 * specs/002-schedule-baseline-tracking-overlay/contracts/baselines.openapi.yaml.
 * If the DTO shape drifts (rename, missing field, wrong type), this file
 * fails to compile under `tsc -b` (and fails this test under Vitest's
 * type-check pass once enabled).
 */
import { describe, expect, it } from 'vitest';
import type {
  BaselineHeaderDto,
  BaselinePayloadDto,
  BaselineWithPayloadDto,
} from '../types';

describe('Baselines DTO type drift (T053)', () => {
  it('a hand-rolled BaselineHeaderDto literal type-checks', () => {
    const dto: BaselineHeaderDto = {
      id: 'b1',
      projectId: 'p1',
      versionLabel: 'v0',
      versionIndex: 0,
      rationale: 'Approved by steering committee 2026-05-08',
      createdAt: '2026-05-09T09:14:00.000Z',
      createdBy: { id: 'u1', fullName: 'Andrian' },
    };
    expect(dto.versionLabel).toBe('v0');
  });

  it('a hand-rolled BaselineWithPayloadDto type-checks', () => {
    const dto: BaselineWithPayloadDto = {
      id: 'b1',
      projectId: 'p1',
      versionLabel: 'v0',
      versionIndex: 0,
      rationale: 'r',
      createdAt: '2026-05-09T09:14:00.000Z',
      createdBy: { id: 'u1', fullName: 'Andrian' },
      payload: {
        schemaVersion: 1,
        capturedAt: '2026-05-09T09:14:00.000Z',
        project: { id: 'p1', name: 'P', start: '2026-05-04' },
        tasks: [
          {
            id: 't1',
            name: 'A',
            durationDays: 3,
            isMilestone: false,
            scheduleMode: 'auto',
            constraint: { kind: 'ASAP' },
            progressPct: 0,
            orderIndex: 0,
          },
        ],
        dependencies: [
          { id: 'd1', predecessorId: 't0', successorId: 't1', type: 'FS', lagDays: 0 },
        ],
        resources: [
          {
            id: 'r1',
            code: 'PM',
            name: 'PM',
            defaultAllocationPct: 100,
            orderIndex: 0,
          },
        ],
        assignments: [
          { id: 'a1', taskId: 't1', resourceId: 'r1', allocationPct: 100 },
        ],
        calendar: { workingDaysOfWeek: [1, 2, 3, 4, 5], holidays: [], hoursPerDay: 8 },
        settings: { taskOrder: ['t1'], resourceOrder: ['r1'], collapsedIds: [] },
      },
    };
    expect(dto.payload.tasks).toHaveLength(1);
  });

  it('schemaVersion is fixed to 1 (literal type 1)', () => {
    const v1: BaselinePayloadDto['schemaVersion'] = 1;
    expect(v1).toBe(1);
    // @ts-expect-error — only `1` is allowed; other values should fail to compile.
    const _bad: BaselinePayloadDto['schemaVersion'] = 2;
    expect(_bad).toBe(2);
  });
});
