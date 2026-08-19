import { startOfDay } from "@/lib/derive";
import type { LogEvent, MotherhoodStage, Stage } from "@/lib/types";
import type { Intensity } from "@/data/modes.config";

export interface Readiness {
  level: "low" | "medium" | "high";
  reasonText: string;
  /** Нет ни одного лога за сегодня — уровень взят по умолчанию. */
  fromDefault: boolean;
}

const SLEEP_ORDER: Record<string, number> = {
  "<5ч": 0,
  "5–6ч": 1,
  "7–8ч": 2,
  "9+ч": 3,
  "<2ч": 0,
  "2–3ч": 1,
  "3–4ч": 2,
  "4+ч": 3,
  "Плохо спала": 0,
  "С перерывами": 1,
  Нормально: 2,
  Отлично: 3,
};

export function todayEvents(events: LogEvent[], now = Date.now()): LogEvent[] {
  const from = startOfDay(now);
  return events.filter((event) => event.timestamp >= from);
}

/**
 * Rule-based скоринг готовности по сегодняшним логам. Никакого ML.
 * Беременность и послеродовой период сюда не попадают — у них свой safe-pool.
 */
export function getReadiness(events: LogEvent[], now = Date.now()): Readiness {
  const today = todayEvents(events, now);
  if (today.length === 0) {
    return {
      level: "medium",
      reasonText: "Данных за сегодня пока нет — предлагаем умеренную нагрузку по умолчанию.",
      fromDefault: true,
    };
  }

  let score = 0;
  const reasons: string[] = [];

  const mood = [...today].reverse().find((event) => typeof event.scaleVal === "number");
  if (mood?.scaleVal) {
    const moodIdx = mood.scaleVal - 1;
    score += (moodIdx - 2) * 1.5;
    reasons.push(`настроение ${mood.scaleVal}/5`);
  }

  const sleep = [...today].reverse().find((event) => event.chipId === "sleep");
  if (sleep) {
    const sleepIdx = SLEEP_ORDER[sleep.summary];
    if (sleepIdx !== undefined) {
      score += (sleepIdx - 1) * 1.2;
      reasons.push(`сон: ${sleep.summary.toLowerCase()}`);
    }
  }

  const symptomCount = today
    .filter((event) => event.chipId === "symptom")
    .reduce((sum, event) => sum + (event.multiLabels?.length ?? 0), 0);
  if (symptomCount > 0) {
    score -= symptomCount * 1.0;
    reasons.push(`симптомов отмечено: ${symptomCount}`);
  }

  const heavy = today.some(
    (event) =>
      (event.chipId === "flow" && event.summary.includes("Обильные")) ||
      (event.chipId === "hotflash" && event.summary.includes("Сильный")),
  );
  if (heavy) {
    score -= 2;
    reasons.push("отмечена высокая интенсивность — снижаем нагрузку");
  }

  const level: Readiness["level"] = score >= 2 ? "high" : score >= -1 ? "medium" : "low";

  return {
    level,
    reasonText: reasons.length ? `Учли: ${reasons.join(", ")}.` : "Учли сегодняшние записи.",
    fromDefault: false,
  };
}

export function intensityFor(level: Readiness["level"]): Intensity {
  return level;
}

export function isSafeStage(stage: Stage | undefined): stage is MotherhoodStage {
  return stage === "pregnancy" || stage === "postpartum";
}
