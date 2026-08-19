import type { FrequencyItem } from "@/features/analytics/aggregations";
import { pluralRu } from "@/lib/derive";

export function BarList({ items }: { items: FrequencyItem[] }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-text">{item.label}</span>
            <span className="mono-label text-text-dim">
              {item.count} {pluralRu(item.count, "раз", "раза", "раз")}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
