import { dateToX, type TimeScale } from './timeScale';

interface Props {
  scale: TimeScale;
  height: number;
}

export function TodayLine({ scale, height }: Props) {
  const today = new Date();
  const x = dateToX(today, scale);
  return (
    <div className="absolute top-0 pointer-events-none z-10" style={{ left: x, height }}>
      <div className="absolute top-0 bottom-0 w-px bg-(--color-today)" />
      <div className="absolute -top-2 -left-1 w-2 h-2 rotate-45 bg-(--color-today) shadow-sm" />
    </div>
  );
}
