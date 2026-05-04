import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { isApiConfigured } from '../../api/client';

export function StatusBar({ savedAgo }: { savedAgo: number | null }) {
  const tasks = useProjectStore(s => s.tasks);
  const schedule = useProjectStore(s => s.schedule);
  const cycles = schedule.cycles;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);
  void now;

  return (
    <div className="h-7 flex items-center justify-between px-3 text-[11px] text-(--color-ink-muted) border-t border-(--color-border) bg-(--color-surface)">
      <div className="flex items-center gap-3">
        <span><strong className="font-semibold">{tasks.size}</strong> tasks</span>
        <span className="opacity-50">·</span>
        <span>
          Project ends <strong className="font-semibold tabular">{format(schedule.projectFinish, 'MMM d, yyyy')}</strong>
        </span>
        {cycles.length > 0 && (
          <>
            <span className="opacity-50">·</span>
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={11} /> {cycles.length} cycle{cycles.length === 1 ? '' : 's'} detected
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-(--color-ink-subtle)">
        {savedAgo !== null ? (
          <>
            <CheckCircle2 size={11} className="text-emerald-500" />
            Saved {savedAgo === 0 ? 'just now' : `${savedAgo}s ago`}{isApiConfigured ? ' · cloud' : ' · local'}
          </>
        ) : (
          isApiConfigured ? 'Cloud sync · auto-saves to your account' : 'Local-only · auto-saves to this browser'
        )}
      </div>
    </div>
  );
}
