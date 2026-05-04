import { useCallback } from 'react';

interface ResizeOptions {
  axis: 'x' | 'y';
  /** Optional: called at pointerdown so the consumer can snapshot a starting value. */
  onStart?: () => void;
  /** Called continuously with the delta (in px) from drag start. */
  onResize: (deltaPx: number) => void;
  /** Optional: called when drag ends. */
  onEnd?: () => void;
}

/**
 * Imperative resize-drag hook. Returns an `onPointerDown` to attach to a
 * resize handle. `onResize` receives the cumulative delta from drag start.
 *
 * Body-level cursor + userSelect lock during the drag so text selection
 * doesn't fight the gesture.
 */
export function useResizeDrag({ axis, onStart, onResize, onEnd }: ResizeOptions) {
  return useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const startCoord = axis === 'x' ? e.clientX : e.clientY;

      const prevCursor = document.body.style.cursor;
      const prevSelect = document.body.style.userSelect;
      document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      onStart?.();

      const move = (ev: PointerEvent) => {
        const cur = axis === 'x' ? ev.clientX : ev.clientY;
        onResize(cur - startCoord);
      };
      const up = () => {
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
        try { target.releasePointerCapture(e.pointerId); } catch {}
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevSelect;
        onEnd?.();
      };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    },
    [axis, onStart, onResize, onEnd],
  );
}
