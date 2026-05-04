import { useState, useEffect } from 'react';
import { cn } from '../../lib/cn';

interface Props {
  value: string; // raw digits as string
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: number;
}

/**
 * Number input that displays with thousands separators while storing the raw
 * digit string. Uses text input under the hood so commas can render.
 */
export function NumberInput({ value, onChange, placeholder, className, required, min }: Props) {
  const [display, setDisplay] = useState(formatNumber(value));

  useEffect(() => {
    setDisplay(formatNumber(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip everything except digits + decimal point
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    // Allow only one decimal point
    const parts = raw.split('.');
    const cleaned = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : raw;
    onChange(cleaned);
    setDisplay(formatNumber(cleaned));
  }

  function handleBlur() {
    if (value === '' || value === '.') return;
    if (min !== undefined && Number(value) < min) {
      const m = String(min);
      onChange(m);
      setDisplay(formatNumber(m));
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      required={required}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2 rounded border border-(--color-border) bg-(--color-bg) text-[14px] outline-none focus:ring-2 focus:ring-(--color-brand) tabular',
        className,
      )}
    />
  );
}

function formatNumber(raw: string): string {
  if (raw === '' || raw === '.') return raw;
  const n = Number(raw);
  if (Number.isNaN(n)) return raw;
  // Preserve trailing decimal user is mid-entering
  if (raw.endsWith('.')) {
    const intPart = raw.slice(0, -1);
    return `${Number(intPart).toLocaleString()}.`;
  }
  // Preserve user-entered decimals
  if (raw.includes('.')) {
    const [intPart, decPart] = raw.split('.');
    return `${Number(intPart).toLocaleString()}.${decPart}`;
  }
  return n.toLocaleString();
}
