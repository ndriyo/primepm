import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renders children and hides label initially', () => {
    render(
      <Tooltip label="Help">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });

  it('shows tooltip label on mouse enter and hides on leave', () => {
    render(
      <Tooltip label="Help">
        <button>Hover</button>
      </Tooltip>,
    );
    const wrapper = screen.getByRole('button').parentElement!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText('Help')).toBeInTheDocument();
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });

  it('shows tooltip label on focus and hides on blur', () => {
    render(
      <Tooltip label="Help">
        <button>Focus</button>
      </Tooltip>,
    );
    const wrapper = screen.getByRole('button').parentElement!;
    fireEvent.focus(wrapper);
    expect(screen.getByText('Help')).toBeInTheDocument();
    fireEvent.blur(wrapper);
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });

  it('renders a keyboard shortcut chip when provided', () => {
    render(
      <Tooltip label="Save" shortcut="⌘S">
        <button>X</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole('button').parentElement!);
    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });

  it('positions correctly via side prop class hooks', () => {
    const { rerender } = render(
      <Tooltip label="L" side="top"><button>X</button></Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole('button').parentElement!);
    let label = screen.getByText('L');
    expect(label.className).toContain('bottom-full');
    rerender(<Tooltip label="L" side="left"><button>X</button></Tooltip>);
    fireEvent.mouseEnter(screen.getByRole('button').parentElement!);
    label = screen.getByText('L');
    expect(label.className).toContain('right-full');
    rerender(<Tooltip label="L" side="right"><button>X</button></Tooltip>);
    fireEvent.mouseEnter(screen.getByRole('button').parentElement!);
    label = screen.getByText('L');
    expect(label.className).toContain('left-full');
  });
});
