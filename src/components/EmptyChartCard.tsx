interface EmptyChartCardProps {
  title: string;
  hint: string;
  height?: number;
}

/** Дефолтный паттерн вместо мокового графика. */
export function EmptyChartCard({ title, hint, height = 116 }: EmptyChartCardProps) {
  return (
    <section className="rounded-card border border-dashed border-border bg-transparent p-4">
      <h3 className="mono-label text-text-faint">{title}</h3>
      <div
        className="mt-3 flex items-center justify-center rounded-xl px-4 text-center"
        style={{ height }}
      >
        <p className="max-w-[280px] text-[12px] leading-snug text-text-faint">{hint}</p>
      </div>
    </section>
  );
}
