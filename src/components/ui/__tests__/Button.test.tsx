import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('fires onClick when activated', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards the ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>X</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies the requested variant class hooks', () => {
    const { rerender } = render(<Button variant="primary">A</Button>);
    expect(screen.getByRole('button').className).toContain('bg-(--color-ink)');
    rerender(<Button variant="danger">B</Button>);
    expect(screen.getByRole('button').className).toContain('bg-(--color-danger)');
    rerender(<Button variant="ghost">C</Button>);
    expect(screen.getByRole('button').className).toContain('bg-transparent');
    rerender(<Button variant="secondary">D</Button>);
    expect(screen.getByRole('button').className).toContain('bg-(--color-surface)');
  });

  it('applies size class hooks', () => {
    const { rerender } = render(<Button size="sm">A</Button>);
    expect(screen.getByRole('button').className).toContain('h-7');
    rerender(<Button size="lg">B</Button>);
    expect(screen.getByRole('button').className).toContain('h-10');
    rerender(<Button size="md">C</Button>);
    expect(screen.getByRole('button').className).toContain('h-8');
  });

  it('merges a custom className', () => {
    render(<Button className="custom-x">A</Button>);
    expect(screen.getByRole('button').className).toContain('custom-x');
  });
});
