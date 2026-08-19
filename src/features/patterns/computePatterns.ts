import { chipFrequency, labelFrequency, scaleSeries } from "@/features/analytics/aggregations";
import { getChipConfig } from "@/data/modes.config";
import type { LogEvent, Mode, Stage } from "@/lib/types";
import { pluralRu } from "@/lib/derive";
import { buildSymptomCycleEvidence, type EvidenceTier } from "./cycleEvidence";

export type PatternTier = "empty" | "low" | "medium" | "full";

export const PATTERN_THRESHOLD = 5;
export const PATTERN_FULL_THRESHOLD = 12;

export function patternTier(count: number): PatternTier {
  if (count === 0) return "empty";
  if (count < PATTERN_THRESHOLD) return "low";
  if (count < PATTERN_FULL_THRESHOLD) return "medium";
  return "full";
}

export interface Pattern {
  id: string;
  title: string;
  detail: string;
  /** Есть только у паттернов с доказательной базой по циклам. */
  evidenceTier?: EvidenceTier;
}

const TIER_LABEL: Record<EvidenceTier, string> = {
  strong: "устойчивый",
  moderate: "вероятный",
  first_signs: "первые признаки",
};

/**
 * Только то, что реально вычисляется из логов. Ни одной формулировки
 * вида «в 5 из 6 циклов» без 5–6 циклов данных за спиной.
 */
export function computePatterns(events: LogEvent[], mode: Mode, stage?: Stage): Pattern[] {
  const patterns: Pattern[] = [];
  if (events.length === 0) return patterns;

  // Повторяемость симптома в один и тот же день цикла — только там, где
  // цикл вообще есть и не является нерегулярным по определению режима.
  if (mode === "cycle" || mode === "fertility") {
    const evidence = buildSymptomCycleEvidence(events);
    if (evidence) {
      patterns.push({
        id: "cycle-evidence",
        title: `${evidence.label} — ${TIER_LABEL[evidence.tier]} паттерн`,
        detail:
          evidence.dayRange[0] === evidence.dayRange[1]
            ? `Повторяется на ${evidence.typicalDay}-й день цикла в ${evidence.matchedCycles} из ${evidence.evaluatedCycles} последних циклов.`
            : `Обычно на ${evidence.typicalDay}-й день цикла (дни ${evidence.dayRange[0]}–${evidence.dayRange[1]}) в ${evidence.matchedCycles} из ${evidence.evaluatedCycles} последних циклов.`,
        evidenceTier: evidence.tier,
      });
    }
  }

  const chips = [...chipFrequency(events).entries()].sort((a, b) => b[1] - a[1]);
  const [topChipId, topChipCount] = chips[0] ?? [];
  if (topChipId && topChipCount && topChipCount >= 2) {
    const label = getChipConfig(mode, stage, topChipId)?.label ?? topChipId;
    patterns.push({
      id: "top-chip",
      title: `Чаще всего ты отмечаешь: ${label.toLowerCase()}`,
      detail: `${topChipCount} из ${events.length} записей относятся к этой категории.`,
    });
  }

  const labels = labelFrequency(events);
  const topLabel = labels[0];
  if (topLabel && topLabel.count >= 2) {
    patterns.push({
      id: "top-label",
      title: `Повторяется: ${topLabel.label.toLowerCase()}`,
      detail: `Отмечено ${topLabel.count} ${pluralRu(topLabel.count, "раз", "раза", "раз")} среди твоих записей.`,
    });
  }

  const mood = scaleSeries(events, "mood");
  if (mood.length >= 2) {
    const first = mood[0].value;
    const last = mood[mood.length - 1].value;
    if (first !== last) {
      patterns.push({
        id: "mood-trend",
        title: last > first ? "Настроение в записях растёт" : "Настроение в записях снижается",
        detail:
          last > first
            ? `От ${first} к ${last} по пятибалльной шкале за ${mood.length} отметок.`
            : `От ${first} к ${last} по пятибалльной шкале за ${mood.length} отметок. Если так продолжается — стоит обсудить это с квалифицированным клиницистом.`,
      });
    }
  }

  return patterns;
}

/** Один осмысленный инсайт для medium-состояния. */
export function primaryPattern(events: LogEvent[], mode: Mode): Pattern | null {
  return computePatterns(events, mode)[0] ?? null;
}
