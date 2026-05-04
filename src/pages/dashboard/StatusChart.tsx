import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

interface Props {
  data: Array<{ status: string; count: number; budget: number }>;
}

const COLORS = ['#0ea5e9', '#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#facc15', '#94a3b8'];

interface CellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
}

function Cell(props: CellProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, name = '' } = props;
  const fill = COLORS[index % COLORS.length];
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={2} rx={4} />
      {width > 60 && height > 24 && (
        <text x={x + 8} y={y + 18} fontSize={11} fontWeight={600} fill="white">
          {name}
        </text>
      )}
    </g>
  );
}

export function StatusChart({ data }: Props) {
  const treemapData = data
    .filter(d => d.budget > 0 || d.count > 0)
    .map(d => ({ name: d.status, size: d.budget > 0 ? d.budget : d.count, count: d.count, budget: d.budget }));

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold tracking-tight">Projects by status</div>
        <div className="text-[11px] text-(--color-ink-muted)">Sized by budget</div>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        {treemapData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-(--color-ink-muted)">
            No data
          </div>
        ) : (
          <ResponsiveContainer>
            <Treemap data={treemapData} dataKey="size" content={<Cell />}>
              <Tooltip
                formatter={(_v, _n, item: { payload?: { count: number; budget: number } }) =>
                  item.payload ? [`${item.payload.count} projects · $${item.payload.budget.toLocaleString()}`, ''] : ''
                }
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
