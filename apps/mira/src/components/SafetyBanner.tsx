import { Icon } from "@/data/icons";
import type { SafetyAdvisory } from "@/lib/safety";

export function SafetyBanner({ advisory }: { advisory: SafetyAdvisory }) {
  const urgent = advisory.tier === "discuss_soon";
  return (
    <div
      className={`flex items-start gap-3 rounded-card border p-4 ${
        urgent ? "border-danger/40 bg-danger/10" : "border-border bg-surface-2"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${urgent ? "text-danger" : "text-text-dim"}`}>
        <Icon name="shield" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-snug text-text">{advisory.title}</p>
        <p className="mt-1 text-[12px] leading-snug text-text-dim">{advisory.message}</p>
      </div>
    </div>
  );
}
