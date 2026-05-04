import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface Props {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}

export function GridCell({ value, onCommit, className, placeholder, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onCommit(trimmed);
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        placeholder={placeholder}
        className={cn(
          'w-full h-full px-2 bg-(--color-surface) outline-none ring-1 ring-(--color-brand) rounded-sm',
          className,
        )}
      />
    );
  }

  return (
    <div
      onDoubleClick={() => { if (!readOnly) setEditing(true); }}
      className={cn(
        'w-full h-full px-2 flex items-center truncate',
        readOnly ? 'cursor-default' : 'cursor-text',
        className,
      )}
      title={value}
    >
      {value || <span className="text-(--color-ink-subtle)">{placeholder ?? ''}</span>}
    </div>
  );
}
