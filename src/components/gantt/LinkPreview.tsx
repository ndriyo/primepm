import type { DepType } from '../../engine';

export interface LinkPreviewState {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: DepType;
  validTarget: boolean;
}

const COLORS: Record<DepType, string> = {
  FS: '#0f172a',
  SS: '#7c3aed',
  FF: '#0d9488',
  SF: '#d97706',
};

export function LinkPreview({ link }: { link: LinkPreviewState | null }) {
  if (!link) return null;
  const { fromX, fromY, toX, toY } = link;
  const cx = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} C ${cx} ${fromY}, ${cx} ${toY}, ${toX} ${toY}`;
  const color = link.validTarget ? COLORS[link.type] : '#a1a1aa';
  return (
    <>
      <svg
        className="absolute top-0 left-0 pointer-events-none z-30"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <path
          d={path}
          stroke={color}
          strokeWidth={1.6}
          strokeDasharray={link.validTarget ? '0' : '4 3'}
          fill="none"
        />
        <circle cx={fromX} cy={fromY} r={3.5} fill={color} />
        <circle cx={toX} cy={toY} r={3.5} fill={color} />
      </svg>
      {link.validTarget && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-md text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 shadow text-white pointer-events-none"
          style={{
            left: cx,
            top: (fromY + toY) / 2 - 14,
            background: COLORS[link.type],
          }}
        >
          {link.type}
        </div>
      )}
    </>
  );
}
