import { detectCycleStarts } from "@/features/analytics/aggregations";
import { startOfDay } from "@/lib/derive";
import type { LogEvent } from "@/lib/types";

export type EvidenceTier = "strong" | "moderate" | "first_signs";

export interface SymptomCycleEvidence {
  label: string;
  tier: EvidenceTier;
  recurrenceRate: number;
  matchedCycles: number;
  evaluatedCycles: number;
  typicalDay: number;
  dayRange: [number, number];
}

const DAY_MS = 86_400_000;
const MAX_EVALUATED_CYCLES = 6;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

/**
 * Повторяемость симптома в один и тот же день цикла на нескольких реальных
 * циклах — а не просто «сколько раз отмечено». Пороги уверенности
 * перенесены из соседнего проекта (new-mira), где они откалиброваны на
 * реальных данных: strong ≥4 циклов и ≥67% повторяемости при разбросе ≤5
 * дней, moderate ≥3 циклов и ≥60%, иначе first_signs. Ниже 50% повторяемости
 * или 2 совпавших циклов — паттерн не показываем вообще, это было бы шумом.
 */
export function buildSymptomCycleEvidence(events: LogEvent[]): SymptomCycleEvidence | null {
  const starts = detectCycleStarts(events);
  if (starts.length < 4) return null;

  const evaluated = starts.slice(-Math.min(MAX_EVALUATED_CYCLES + 1, starts.length));
  const completedCycles = evaluated.slice(0, -1).map((start, index) => ({
    start,
    end: evaluated[index + 1],
  }));
  if (completedCycles.length < 3) return null;

  const symptomEvents = events.filter(
    (event) => event.chipId === "symptom" && (event.multiLabels?.length ?? 0) > 0,
  );

  // label -> cycleIndex -> earliest day-of-cycle отметки
  const byLabel = new Map<string, Map<number, number>>();

  for (const event of symptomEvents) {
    const day = startOfDay(event.timestamp);
    const cycleIndex = completedCycles.findIndex((cycle) => day >= cycle.start && day < cycle.end);
    if (cycleIndex === -1) continue;
    const dayOfCycle = Math.round((day - completedCycles[cycleIndex].start) / DAY_MS) + 1;

    for (const label of event.multiLabels ?? []) {
      const perCycle = byLabel.get(label) ?? new Map<number, number>();
      const existing = perCycle.get(cycleIndex);
      if (existing === undefined || dayOfCycle < existing) perCycle.set(cycleIndex, dayOfCycle);
      byLabel.set(label, perCycle);
    }
  }

  const evaluatedCycles = completedCycles.length;
  let best: SymptomCycleEvidence | null = null;

  for (const [label, perCycle] of byLabel) {
    const matchedCycles = perCycle.size;
    const recurrenceRate = matchedCycles / evaluatedCycles;
    if (matchedCycles < 2 || recurrenceRate < 0.5) continue;

    const days = [...perCycle.values()];
    const typicalDay = median(days);
    const dayRange: [number, number] = [Math.min(...days), Math.max(...days)];
    const spread = dayRange[1] - dayRange[0];

    let tier: EvidenceTier;
    if (matchedCycles >= 4 && recurrenceRate >= 0.67 && spread <= 5) tier = "strong";
    else if (matchedCycles >= 3 && recurrenceRate >= 0.6) tier = "moderate";
    else tier = "first_signs";

    const candidate: SymptomCycleEvidence = {
      label,
      tier,
      recurrenceRate,
      matchedCycles,
      evaluatedCycles,
      typicalDay,
      dayRange,
    };

    if (!best || candidate.recurrenceRate > best.recurrenceRate) best = candidate;
  }

  return best;
}
