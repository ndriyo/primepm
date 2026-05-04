import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';

interface Props {
  data: Array<{ id: string; name: string; budget: number; score: number }>;
}

export function ScoreQuadrant({ data }: Props) {
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold tracking-tight">Score vs budget</div>
        <div className="text-[11px] text-(--color-ink-muted)">Each dot is a project</div>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-(--color-ink-muted)">
            No data
          </div>
        ) : (
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                type="number"
                dataKey="budget"
                name="Budget"
                tick={{ fontSize: 11, fill: '#737373' }}
                label={{ value: 'Budget', position: 'insideBottom', offset: -8, fontSize: 11, fill: '#525252' }}
              />
              <YAxis
                type="number"
                dataKey="score"
                name="Score"
                tick={{ fontSize: 11, fill: '#737373' }}
                domain={[0, 'auto']}
                label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#525252' }}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => {
                  const v = typeof value === 'number' ? value : 0;
                  const n = String(name ?? '');
                  return [n === 'Budget' ? v.toLocaleString() : v.toFixed(2), n];
                }}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as { name?: string } | undefined;
                  return p?.name ?? '';
                }}
              />
              <Scatter data={data} fill="#0ea5e9" />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
