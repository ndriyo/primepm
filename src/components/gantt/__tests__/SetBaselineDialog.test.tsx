import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SetBaselineDialog } from '../SetBaselineDialog';

describe('SetBaselineDialog (US1 / FR-002)', () => {
  it('Confirm is disabled while rationale is empty', () => {
    render(<SetBaselineDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const confirm = screen.getByTestId('baseline-confirm') as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it('Confirm is disabled when rationale is whitespace-only', () => {
    render(<SetBaselineDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByTestId('baseline-rationale') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '   \n\t' } });
    const confirm = screen.getByTestId('baseline-confirm') as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it('Confirm becomes enabled when rationale has content; click invokes onConfirm with trimmed value', async () => {
    const onConfirm = vi.fn(async () => {});
    render(<SetBaselineDialog open onConfirm={onConfirm} onCancel={vi.fn()} />);
    const input = screen.getByTestId('baseline-rationale') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '  Approved by steering  ' } });
    const confirm = screen.getByTestId('baseline-confirm') as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledWith('Approved by steering');
  });

  it('keeps rationale and surfaces an error when onConfirm rejects', async () => {
    const onConfirm = vi.fn(async () => {
      throw new Error('boom');
    });
    render(<SetBaselineDialog open onConfirm={onConfirm} onCancel={vi.fn()} />);
    const input = screen.getByTestId('baseline-rationale') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'real reason' } });
    fireEvent.click(screen.getByTestId('baseline-confirm'));
    await waitFor(() => expect(screen.getByTestId('baseline-error')).toBeInTheDocument());
    expect((input as HTMLTextAreaElement).value).toBe('real reason');
  });

  it('Cancel calls onCancel', () => {
    const onCancel = vi.fn();
    render(<SetBaselineDialog open onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
