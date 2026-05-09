import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from '../Stepper';

const STEPS = [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }];

describe('Stepper', () => {
  it('renders every step label', () => {
    render(<Stepper steps={STEPS} current={0} />);
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  it('shows numeric markers for upcoming steps and a check for done steps', () => {
    render(<Stepper steps={STEPS} current={2} onJump={() => {}} />);
    // Steps 1 and 2 are done → check icons (no number rendered).
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    // The active (current) step renders its number marker.
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('disables jumping forward beyond the current step', async () => {
    const onJump = vi.fn();
    render(<Stepper steps={STEPS} current={0} onJump={onJump} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).toBeDisabled();
    expect(buttons[2]).toBeDisabled();
    await userEvent.click(buttons[1]);
    expect(onJump).not.toHaveBeenCalled();
  });

  it('jumps backward when clicked at or before current', async () => {
    const onJump = vi.fn();
    render(<Stepper steps={STEPS} current={2} onJump={onJump} />);
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]);
    expect(onJump).toHaveBeenCalledWith(0);
  });

  it('disables every step when no onJump is supplied', () => {
    render(<Stepper steps={STEPS} current={2} />);
    for (const b of screen.getAllByRole('button')) {
      expect(b).toBeDisabled();
    }
  });
});
