import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BaselineVersionSelector } from '../BaselineVersionSelector';
import type { BaselineHeaderDto } from '../../../api/types';

const headerFor = (idx: number, id?: string): BaselineHeaderDto => ({
  id: id ?? `b${idx}`,
  projectId: 'p1',
  versionLabel: `v${idx}`,
  versionIndex: idx,
  rationale: `Reason ${idx}`,
  createdAt: `2026-05-${10 - idx}T09:00:00Z`,
  createdBy: { id: 'u1', fullName: 'Andrian' },
});

describe('BaselineVersionSelector (FR-013)', () => {
  it('is hidden when there are zero baselines', () => {
    const { container } = render(
      <BaselineVersionSelector headers={[]} active="latest" onChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('is hidden when there is exactly one baseline (≤ 1)', () => {
    const { container } = render(
      <BaselineVersionSelector headers={[headerFor(0)]} active="latest" onChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('is visible when there are two or more baselines', () => {
    render(
      <BaselineVersionSelector
        headers={[headerFor(1, 'b1'), headerFor(0, 'b0')]}
        active="latest"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('baseline-version-selector')).toBeInTheDocument();
  });

  it('default active value is "latest"', () => {
    render(
      <BaselineVersionSelector
        headers={[headerFor(2, 'c'), headerFor(1, 'b'), headerFor(0, 'a')]}
        active="latest"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('baseline-active-label').textContent).toContain('v2');
    expect(screen.getByTestId('baseline-active-label').textContent).toContain('latest');
  });

  it('selecting a specific version calls onChange with its baseline id', () => {
    const onChange = vi.fn();
    render(
      <BaselineVersionSelector
        headers={[headerFor(2, 'c'), headerFor(1, 'b'), headerFor(0, 'a')]}
        active="latest"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId('baseline-active-label'));
    fireEvent.click(screen.getByTestId('baseline-option-v0'));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('selecting "Latest" calls onChange with the "latest" sentinel', () => {
    const onChange = vi.fn();
    render(
      <BaselineVersionSelector
        headers={[headerFor(2, 'c'), headerFor(1, 'b'), headerFor(0, 'a')]}
        active="a"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId('baseline-active-label'));
    fireEvent.click(screen.getByTestId('baseline-option-latest'));
    expect(onChange).toHaveBeenCalledWith('latest');
  });
});
