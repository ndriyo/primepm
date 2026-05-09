import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberInput } from '../NumberInput';

describe('NumberInput', () => {
  it('renders the formatted display for the current value', () => {
    render(<NumberInput value="1234" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('1,234');
  });

  it('shows the placeholder when value is empty', () => {
    render(<NumberInput value="" onChange={() => {}} placeholder="Amount" />);
    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
  });

  it('reports the raw cleaned value on change (digits only)', async () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), '12,3a4');
    // Last call is the most recent typed key
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last).toBe('1234');
  });

  it('keeps the trailing decimal while typing', () => {
    const onChange = vi.fn();
    const { rerender } = render(<NumberInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12.' } });
    expect(onChange).toHaveBeenLastCalledWith('12.');
    rerender(<NumberInput value="12." onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveValue('12.');
  });

  it('preserves decimals during entry', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1234.56' } });
    expect(onChange).toHaveBeenLastCalledWith('1234.56');
  });

  it('drops a second decimal point', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12.3.4' } });
    expect(onChange).toHaveBeenLastCalledWith('12.34');
  });

  it('clamps to min on blur', () => {
    const onChange = vi.fn();
    render(<NumberInput value="2" onChange={onChange} min={5} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('does not clamp empty / partial decimal on blur', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} min={5} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('supports the required attribute', () => {
    render(<NumberInput value="" onChange={() => {}} required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});
