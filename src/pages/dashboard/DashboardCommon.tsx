import type { ReactNode } from 'react';

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaDir,
  spark,
  sparkColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaDir?: 'up' | 'down' | '';
  spark?: number[];
  sparkColor?: string;
}) {
  return (
    <div className="pp-kpi pp-fade-in">
      <div className="pp-kpi-label">{label}</div>
      <div className="pp-kpi-value">
        <span>{value}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      {delta && (
        <div className={`pp-kpi-delta ${deltaDir ?? ''}`}>
          {deltaDir === 'up' && '▲ '}
          {deltaDir === 'down' && '▼ '}
          {delta}
        </div>
      )}
      {spark && spark.length > 1 && (
        <svg className="pp-kpi-spark" viewBox="0 0 78 28" preserveAspectRatio="none">
          {(() => {
            const min = Math.min(...spark);
            const max = Math.max(...spark);
            const range = max - min || 1;
            const pts = spark.map((v, i) => {
              const x = (i / (spark.length - 1)) * 78;
              const y = 26 - ((v - min) / range) * 22;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
            return (
              <>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={sparkColor ?? 'var(--pp-accent)'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            );
          })()}
        </svg>
      )}
    </div>
  );
}

export function Card({ title, eyebrow, meta, children }: {
  title: string;
  eyebrow?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="pp-card pp-fade-in">
      <div className="pp-card-head">
        <h3>{title}{eyebrow && <em>· {eyebrow}</em>}</h3>
        {meta && <div className="pp-head-meta">{meta}</div>}
      </div>
      {children}
    </div>
  );
}

export function HealthDot({ kind }: { kind: 'green' | 'amber' | 'red' | 'blue' }) {
  return <span className={`pp-hdot ${kind}`} />;
}

export function Pill({ kind, children }: { kind: 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  return (
    <span className={`pp-pill ${kind}`}>
      <span className="pp-dot" />
      {children}
    </span>
  );
}
