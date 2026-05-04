import { useEffect, useState } from 'react';
import { Sliders } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { CriteriaVersion } from '../../api/types';
import { VersionsList } from './VersionsList';
import { VersionDetail } from './VersionDetail';

export function SelectionPage() {
  const [versions, setVersions] = useState<CriteriaVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await apiClient.listCriteriaVersions();
      setVersions(r.versions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'load_error');
    }
  }

  useEffect(() => { void refresh(); }, []);

  const selected = versions?.find(v => v.id === selectedId) ?? null;

  return (
    <div className="h-full overflow-auto bg-(--color-bg)">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center">
            <Sliders size={16} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Project Selection</h1>
            <p className="text-[13px] text-(--color-ink-muted)">
              Manage scoring criteria versions. Each version owns its criteria and pairwise weights.
            </p>
          </div>
        </div>

        {error && <div className="mb-4 text-[13px] text-(--color-danger)">{error}</div>}

        {selected ? (
          <VersionDetail
            version={selected}
            onBack={() => { setSelectedId(null); void refresh(); }}
            onChanged={refresh}
          />
        ) : (
          <VersionsList
            versions={versions}
            onOpen={id => setSelectedId(id)}
            onChanged={refresh}
          />
        )}
      </main>
    </div>
  );
}
