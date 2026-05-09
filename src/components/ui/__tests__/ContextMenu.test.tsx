import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextMenu, type MenuItem } from '../ContextMenu';

const items: MenuItem[] = [
  { kind: 'header', label: 'Actions' },
  { kind: 'item', label: 'Edit', onClick: vi.fn() },
  { kind: 'separator' },
  { kind: 'item', label: 'Delete', danger: true, onClick: vi.fn() },
  { kind: 'item', label: 'Disabled', disabled: true, onClick: vi.fn() },
];

describe('ContextMenu', () => {
  it('renders nothing when closed', () => {
    render(<ContextMenu open={false} x={0} y={0} items={items} onClose={() => {}} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders headers, separators, and items when open', () => {
    render(<ContextMenu open x={10} y={10} items={items} onClose={() => {}} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Disabled' })).toBeDisabled();
  });

  it('fires onClick + onClose when an item is selected', async () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    const localItems: MenuItem[] = [{ kind: 'item', label: 'Run', onClick }];
    render(<ContextMenu open x={0} y={0} items={localItems} onClose={onClose} />);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Run' }));
    expect(onClick).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('does not fire onClick for disabled items', async () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    const localItems: MenuItem[] = [{ kind: 'item', label: 'D', onClick, disabled: true }];
    render(<ContextMenu open x={0} y={0} items={localItems} onClose={onClose} />);
    await userEvent.click(screen.getByRole('menuitem', { name: 'D' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ContextMenu open x={0} y={0} items={items} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on outside mousedown', () => {
    const onClose = vi.fn();
    render(
      <div>
        <button>Outside</button>
        <ContextMenu open x={0} y={0} items={items} onClose={onClose} />
      </div>,
    );
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the menu', () => {
    const onClose = vi.fn();
    render(<ContextMenu open x={0} y={0} items={items} onClose={onClose} />);
    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clamps position so it never overflows the viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true });
    render(<ContextMenu open x={9999} y={9999} items={items} onClose={() => {}} />);
    const menu = screen.getByRole('menu') as HTMLElement;
    const left = parseInt(menu.style.left, 10);
    const top = parseInt(menu.style.top, 10);
    expect(left).toBeLessThan(400);
    expect(top).toBeLessThan(300);
    expect(left).toBeGreaterThanOrEqual(8);
    expect(top).toBeGreaterThanOrEqual(8);
  });

  it('preventsDefault on contextmenu over the menu itself', () => {
    render(<ContextMenu open x={0} y={0} items={items} onClose={() => {}} />);
    const menu = screen.getByRole('menu');
    const ev = new Event('contextmenu', { bubbles: true, cancelable: true });
    const dispatched = menu.dispatchEvent(ev);
    expect(dispatched).toBe(false); // preventDefault returns false to dispatchEvent
  });
});
