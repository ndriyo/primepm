import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from '../Dialog';

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onClose={() => {}}>
        <div>Body</div>
      </Dialog>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    render(
      <Dialog open onClose={() => {}}>
        <div>Body</div>
      </Dialog>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <div>Body</div>
      </Dialog>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for non-Escape keys', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <div>Body</div>
      </Dialog>,
    );
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose on Escape when modal=true', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} modal>
        <div>Body</div>
      </Dialog>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when the backdrop is clicked (non-modal)', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <div>Body</div>
      </Dialog>,
    );
    // Backdrop is the absolute-inset-0 div with bg-black overlay
    const backdrop = document.querySelector('.absolute.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
