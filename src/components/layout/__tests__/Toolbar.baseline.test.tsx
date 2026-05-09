import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'TOKEN' } } })),
    },
  },
}));

vi.mock('../../../api/client', async () => {
  const actual = await vi.importActual<typeof import('../../../api/client')>('../../../api/client');
  return {
    ...actual,
    isApiConfigured: false,
    apiClient: { ...actual.apiClient, setBaseline: vi.fn(async () => ({})) },
  };
});

import { Toolbar } from '../Toolbar';
import { useProjectStore } from '../../../store/projectStore';

beforeEach(() => {
  useProjectStore.getState().reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Toolbar — Set baseline button (US1 / spec edge case)', () => {
  it('disables the Set baseline button and shows a tooltip when project has zero tasks', () => {
    render(<Toolbar />);
    const btn = screen.getByTestId('toolbar-set-baseline') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    // Hover surfaces the tooltip text used as the disabled-state hint.
    fireEvent.mouseEnter(btn.parentElement!);
    expect(screen.getByText('Add at least one task to set a baseline')).toBeInTheDocument();
  });

  it('enables the Set baseline button when at least one task exists', () => {
    useProjectStore.getState().addTask();
    render(<Toolbar />);
    const btn = screen.getByTestId('toolbar-set-baseline') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});
