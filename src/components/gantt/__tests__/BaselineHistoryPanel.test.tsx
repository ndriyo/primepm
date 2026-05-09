import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'TOKEN' } } })),
    },
  },
}));

import { BaselineHistoryPanel } from '../BaselineHistoryPanel';
import { useProjectStore } from '../../../store/projectStore';
import type { BaselineHeaderDto } from '../../../api/types';

const headerFor = (idx: number): BaselineHeaderDto => ({
  id: `b${idx}`,
  projectId: 'p1',
  versionLabel: `v${idx}`,
  versionIndex: idx,
  rationale: `Reason ${idx}`,
  createdAt: `2026-0${5 - idx}-09T09:14:00Z`,
  createdBy: { id: 'u1', fullName: 'Andrian' },
});

beforeEach(() => {
  useProjectStore.getState().reset();
});
afterEach(() => {
  vi.clearAllMocks();
});

describe('BaselineHistoryPanel (FR-016)', () => {
  it('renders an empty state when there are zero baselines', () => {
    render(<BaselineHistoryPanel />);
    expect(screen.getByTestId('baseline-history-empty')).toBeInTheDocument();
  });

  it('renders all headers newest-first with version, timestamp, creator, rationale', () => {
    useProjectStore.setState({
      baselineHeaders: [headerFor(0), headerFor(1), headerFor(2)],
    });
    const { container } = render(<BaselineHistoryPanel />);
    const rows = container.querySelectorAll('[data-testid^="baseline-row-"]');
    expect(rows).toHaveLength(3);
    // Newest first → first row is v2
    expect(rows[0].getAttribute('data-testid')).toBe('baseline-row-v2');
    expect(rows[2].getAttribute('data-testid')).toBe('baseline-row-v0');

    // Each carries version, creator, rationale
    expect(screen.getByText('v0')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getAllByText('Andrian').length).toBe(3);
    expect(screen.getByText('Reason 0')).toBeInTheDocument();
    expect(screen.getByText('Reason 1')).toBeInTheDocument();
    expect(screen.getByText('Reason 2')).toBeInTheDocument();
  });

  it('marks v0 as ORIGINAL and the highest versionIndex as LATEST; never offers edit or delete', () => {
    useProjectStore.setState({
      baselineHeaders: [headerFor(0), headerFor(1), headerFor(2)],
    });
    const { container } = render(<BaselineHistoryPanel />);
    expect(screen.getByText('ORIGINAL')).toBeInTheDocument();
    expect(screen.getByText('LATEST')).toBeInTheDocument();
    expect(container.querySelector('button[aria-label*="delete" i]')).toBeNull();
    expect(container.querySelector('button[aria-label*="edit" i]')).toBeNull();
  });

  it('shows the immutability cue on every row', () => {
    useProjectStore.setState({
      baselineHeaders: [headerFor(0), headerFor(1)],
    });
    render(<BaselineHistoryPanel />);
    expect(screen.getAllByText('Immutable')).toHaveLength(2);
  });
});
