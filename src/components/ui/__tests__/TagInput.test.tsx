import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from '../TagInput';

describe('TagInput', () => {
  it('renders existing tags as chips', () => {
    render(<TagInput tags={['alpha', 'beta']} onChange={() => {}} />);
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('commits the draft on Enter and clears it', async () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'gamma{Enter}');
    expect(onChange).toHaveBeenCalledWith(['gamma']);
    // Input cleared after commit (controlled internally)
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('commits on comma key', async () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'alpha,');
    expect(onChange).toHaveBeenCalledWith(['alpha']);
  });

  it('splits a comma-separated paste into multiple chips', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a, b, c' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('deduplicates entries when adding existing tag', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['x']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['x']);
  });

  it('respects the max prop', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['a', 'b']} onChange={onChange} max={2} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'c' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('removes a chip via its delete button', async () => {
    const onChange = vi.fn();
    render(<TagInput tags={['alpha', 'beta']} onChange={onChange} />);
    const removeBtn = screen.getByRole('button', { name: 'Remove tag alpha' });
    await userEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(['beta']);
  });

  it('removes the last chip on Backspace when input is empty', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['alpha', 'beta']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['alpha']);
  });

  it('does not commit on whitespace-only draft', async () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('focuses input when the wrapper is clicked', () => {
    render(<TagInput tags={[]} onChange={() => {}} />);
    const wrapper = screen.getByRole('textbox').parentElement!;
    fireEvent.click(wrapper);
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
  });

  it('commits the draft on blur if non-empty', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'alpha' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(['alpha']);
  });

  it('hides placeholder when there are existing tags', () => {
    render(<TagInput tags={['x']} onChange={() => {}} placeholder="Add" />);
    expect(screen.queryByPlaceholderText('Add')).not.toBeInTheDocument();
  });
});
