import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface Props {
  open: boolean;
  /** Called with the trimmed rationale. May reject to keep the dialog open. */
  onConfirm: (rationale: string) => Promise<void>;
  onCancel: () => void;
  /** Optional version label to show in the header (e.g. 'v2'). */
  upcomingVersionLabel?: string;
}

export function SetBaselineDialog({ open, onConfirm, onCancel, upcomingVersionLabel }: Props) {
  const [rationale, setRationale] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset when the dialog opens. Preserve text on close-then-reopen by binding
  // to `open`'s rising edge only.
  useEffect(() => {
    if (open) {
      setRationale('');
      setError(null);
      setPending(false);
      // Autofocus after mount.
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const trimmed = rationale.trim();
  const canConfirm = trimmed.length > 0 && !pending;

  async function handleConfirm() {
    if (!canConfirm) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      // Caller is expected to close us via setOpen(false). Defensive reset:
      setRationale('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set baseline');
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !pending && onCancel()} className="w-[520px]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[18px] font-semibold tracking-tight">Set baseline</h2>
          {upcomingVersionLabel && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--color-accent-50) text-(--color-accent-700)">
              New version · {upcomingVersionLabel}
            </span>
          )}
        </div>
        <p className="text-[13px] text-(--color-ink-muted) mb-5">
          Captures a frozen, immutable snapshot of the entire schedule. The original v0
          cannot be edited or deleted.
        </p>

        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-(--color-ink-2)">Rationale</span>
            <span className="text-[11px] font-medium text-(--color-danger)">Required</span>
          </div>
          <textarea
            ref={inputRef}
            data-testid="baseline-rationale"
            value={rationale}
            onChange={e => setRationale(e.target.value)}
            placeholder="Approved by steering committee 2026-05-08 — locks scope after MR #214 closes scope creep."
            rows={4}
            disabled={pending}
            className="w-full text-[13px] p-3 rounded-lg border border-(--color-border) focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-accent-100) outline-none resize-none"
          />
          <p className="mt-1.5 text-[11.5px] text-(--color-ink-muted)">
            A short, durable sentence that names the approval, decision, or cut-off this
            baseline freezes.
          </p>
        </label>

        {error && (
          <div
            role="alert"
            data-testid="baseline-error"
            className="mt-3 p-2.5 rounded-md bg-(--color-danger-bg) text-(--color-danger) text-[12px]"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!canConfirm}
            onClick={handleConfirm}
            data-testid="baseline-confirm"
          >
            {pending ? 'Setting…' : 'Set baseline'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
