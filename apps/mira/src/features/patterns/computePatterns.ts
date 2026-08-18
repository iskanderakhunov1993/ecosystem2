import { chipFrequency, labelFrequency, scaleSeries } from "@/features/analytics/aggregations";
import { getChipConfig } from "@/data/modes.config";
import type { LogEvent, Mode } from "@/lib/types";
import { pluralRu } from "@/lib/derive";

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
}

/**
 * Только то, что реально вычисляется из логов. Ни одной формулировки
 * вида «в 5 из 6 циклов» без 5–6 циклов данных за спиной.
 */
export function computePatterns(events: LogEvent[], mode: Mode): Pattern[] {
  const patterns: Pattern[] = [];
  if (events.length === 0) return patterns;

  const chips = [...chipFrequency(events).entries()].sort((a, b) => b[1] - a[1]);
  const [topChipId, topChipCount] = chips[0] ?? [];
  if (topChipId && topChipCount && topChipCount >= 2) {
    const label = getChipConfig(mode, topChipId)?.label ?? topChipId;
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
