interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  /** Подпись для случая, когда данных ещё нет (value === "—"). */
  note?: string;
}

export function KpiCard({ label, value, unit, note }: KpiCardProps) {
  const empty = value === "—";
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="mono-label text-text-faint">{label}</p>
      <p className="mt-2 font-display text-[26px] font-semibold leading-none text-text">
        <span className={empty ? "text-text-faint" : undefined}>{value}</span>
        {unit && !empty && <span className="ml-1 text-[13px] font-normal text-text-dim">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-[11px] leading-snug text-text-faint">{note}</p>}
    </div>
  );
}
