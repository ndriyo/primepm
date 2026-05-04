import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Max number of tags allowed (default: unlimited). */
  max?: number;
}

/** Chip-style tag editor. Confirms a tag on Enter, Tab, or comma. Backspace
 *  on an empty input removes the last chip. Pasting a comma-separated list
 *  splits into multiple chips. */
export function TagInput({ tags, onChange, placeholder, className, max }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commitDraft(raw?: string) {
    const text = (raw ?? draft).trim();
    if (!text) return;
    // Allow comma-separated paste
    const parts = text.split(',').map(s => s.trim()).filter(Boolean);
    const next = [...tags];
    for (const p of parts) {
      if (max != null && next.length >= max) break;
      if (!next.includes(p)) next.push(p);
    }
    onChange(next);
    setDraft('');
  }

  function removeAt(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && draft.trim())) {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      removeAt(tags.length - 1);
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border border-(--color-border)',
        'bg-(--color-surface) px-2 py-1.5 min-h-9',
        'focus-within:ring-2 focus-within:ring-(--color-brand) focus-within:border-(--color-brand)',
        className,
      )}
      onClick={(e) => {
        // Focus the inner input when the user clicks empty area.
        const input = (e.currentTarget.querySelector('input') as HTMLInputElement | null);
        input?.focus();
      }}
    >
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-md text-[12px] font-medium',
            'bg-(--color-surface-2) text-(--color-ink) border border-(--color-border)',
            'pl-2 pr-1 py-0.5',
          )}
        >
          {t}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeAt(i); }}
            aria-label={`Remove tag ${t}`}
            className="rounded hover:bg-(--color-surface) p-0.5 text-(--color-ink-subtle) hover:text-(--color-ink)"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commitDraft()}
        placeholder={tags.length === 0 ? (placeholder ?? 'Add a tag…') : ''}
        className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none border-0 px-1 py-0.5"
      />
    </div>
  );
}
