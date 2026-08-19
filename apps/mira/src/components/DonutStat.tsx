interface DonutStatProps {
  value: number;
  total: number;
  caption: string;
  sub?: string;
}

export function DonutStat({ value, total, caption, sub }: DonutStatProps) {
  const size = 92;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, value / total) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${ratio * circumference} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display text-[18px] font-semibold text-text">
          {Math.round(ratio * 100)}%
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-text">{caption}</p>
        {sub && <p className="mt-1 text-[12px] leading-snug text-text-dim">{sub}</p>}
      </div>
    </div>
  );
}
