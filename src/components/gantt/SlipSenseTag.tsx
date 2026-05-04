import { motion, AnimatePresence } from 'motion/react';

export interface SlipSenseInfo {
  x: number;
  y: number;
  deltaDays: number;
  affectedCount: number;
  projectShiftDays: number;
}

export function SlipSenseTag({ info }: { info: SlipSenseInfo | null }) {
  return (
    <AnimatePresence>
      {info && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.12 }}
          className="fixed z-50 pointer-events-none"
          style={{ left: info.x + 16, top: info.y + 16 }}
        >
          <div className="rounded-lg bg-(--color-ink) text-white shadow-(--shadow-popover) px-3 py-2 text-[12px] font-medium tabular">
            <div className="flex items-center gap-2">
              <span
                className={
                  info.deltaDays > 0
                    ? 'text-amber-300'
                    : info.deltaDays < 0
                      ? 'text-emerald-300'
                      : 'text-zinc-300'
                }
              >
                {info.deltaDays > 0 ? '+' : ''}
                {info.deltaDays}d
              </span>
              {info.affectedCount > 0 && (
                <span className="text-zinc-300">↓ {info.affectedCount} task{info.affectedCount === 1 ? '' : 's'}</span>
              )}
            </div>
            {info.projectShiftDays !== 0 && (
              <div className="mt-0.5 text-[10px] text-zinc-400">
                Project: {info.projectShiftDays > 0 ? '+' : ''}
                {info.projectShiftDays}d
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
