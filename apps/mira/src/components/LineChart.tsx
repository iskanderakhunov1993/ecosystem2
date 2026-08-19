import type { SeriesPoint } from "@/features/analytics/aggregations";

interface LineChartProps {
  points: SeriesPoint[];
  min?: number;
  max?: number;
  unit?: string;
  height?: number;
}

/** Простой SVG-график по реальной последовательности значений. */
export function LineChart({ points, min, max, unit, height = 120 }: LineChartProps) {
  const width = 320;
  const padY = 12;
  const values = points.map((point) => point.value);
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;

  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - padY - ((point.value - lo) / span) * (height - padY * 2);
    return { x, y };
  });

  const path = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" height={height}>
        <line x1="0" y1={height - padY} x2={width} y2={height - padY} stroke="var(--border)" strokeWidth="1" />
        {coords.length > 1 && (
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {coords.map((coord, index) => (
          <circle key={index} cx={coord.x} cy={coord.y} r="3" fill="var(--accent)" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        <span className="mono-label text-text-faint">
          {lo.toFixed(values.some((v) => !Number.isInteger(v)) ? 1 : 0)}
          {unit}
        </span>
        <span className="mono-label text-text-faint">
          {points.length} {points.length === 1 ? "запись" : "записей"}
        </span>
        <span className="mono-label text-text-faint">
          {hi.toFixed(values.some((v) => !Number.isInteger(v)) ? 1 : 0)}
          {unit}
        </span>
      </div>
    </div>
  );
}
