import type { ConfidenceTier } from "@/lib/types";

const TONE: Record<ConfidenceTier, string> = {
  HIGH: "border-ok/40 text-ok",
  MEDIUM: "border-warn/40 text-warn",
  LOW: "border-danger/40 text-danger",
};

export function ConfidenceTag({ tier }: { tier: ConfidenceTier }) {
  return (
    <span
      className={`mono-label rounded-md border px-1.5 py-0.5 ${TONE[tier]}`}
      style={{ backgroundColor: "transparent" }}
    >
      {tier}
    </span>
  );
}
