interface RingProps {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  size?: number;
  accentColor?: string;
  /** Дополнительная дуга поверх основной — например, окно фертильности. */
  segment?: { from: number; to: number };
}

export function Ring({
  value,
  max,
  label,
  sublabel,
  size = 208,
  accentColor = "var(--accent)",
  segment,
}: RingProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeMax = max > 0 ? max : 1;
  const progress = Math.min(1, Math.max(0, value / safeMax));

  const segStart = segment ? Math.min(1, Math.max(0, segment.from / safeMax)) : 0;
  const segEnd = segment ? Math.min(1, Math.max(0, segment.to / safeMax)) : 0;
  const segLength = Math.max(0, segEnd - segStart) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        {segment && segLength > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth={stroke}
            strokeDasharray={`${segLength} ${circumference}`}
            strokeDashoffset={-segStart * circumference}
          />
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress * circumference} ${circumference}`}
          style={{ transition: "stroke-dasharray 400ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-[44px] font-semibold leading-none text-text">{label}</span>
        {sublabel && <span className="mono-label mt-3 text-text-dim">{sublabel}</span>}
      </div>
    </div>
  );
}
