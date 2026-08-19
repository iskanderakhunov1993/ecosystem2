import { MODE_LABELS } from "@/data/modes.config";
import { dateKey } from "@/lib/derive";
import type { LogEvent, Mode } from "@/lib/types";

/**
 * Мягкий triage-слой поверх логов: не диагноз и не медицинское заключение,
 * только повод предложить разговор с клиницистом при устойчивых сигналах.
 * Идея и пороги — по мотивам SAFETY_RULES.md соседнего проекта (new-mira),
 * адаптированы под доступные здесь чипы. Формулировка эскалации фиксирована
 * инструкцией проекта: «стоит обсудить это с квалифицированным клиницистом».
 */

export type SafetyTier = "notice" | "discuss_soon";

export interface SafetyAdvisory {
  id: string;
  tier: SafetyTier;
  title: string;
  message: string;
}

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 7;
const CLINICIAN_PHRASE = "стоит обсудить это с квалифицированным клиницистом";

function withinWindow(events: LogEvent[], now: number): LogEvent[] {
  const from = now - WINDOW_DAYS * DAY_MS;
  return events.filter((event) => event.timestamp >= from);
}

function distinctDays(events: LogEvent[]): number {
  return new Set(events.map((event) => dateKey(event.timestamp))).size;
}

export function evaluateSafety(mode: Mode, events: LogEvent[], now = Date.now()): SafetyAdvisory[] {
  const advisories: SafetyAdvisory[] = [];
  const recent = withinWindow(events, now);

  const heavyFlow = recent.filter((event) => event.chipId === "flow" && event.summary.includes("Обильные"));
  if ((mode === "pregnancy" || mode === "postpartum") && heavyFlow.length > 0) {
    advisories.push({
      id: "heavy-flow-critical",
      tier: "discuss_soon",
      title: "Обильное кровотечение",
      message: `Обильные выделения в режиме «${MODE_LABELS[mode]}» — ${CLINICIAN_PHRASE}, желательно в ближайшее время.`,
    });
  } else if ((mode === "cycle" || mode === "ttc" || mode === "perimenopause") && distinctDays(heavyFlow) >= 3) {
    advisories.push({
      id: "heavy-flow-persistent",
      tier: "notice",
      title: "Стабильно обильные выделения",
      message: `Обильные выделения отмечены несколько дней за последнюю неделю — если это повторяется от цикла к циклу, ${CLINICIAN_PHRASE}.`,
    });
  }

  const severeHotflash = recent.filter(
    (event) => event.chipId === "hotflash" && event.summary.includes("Сильный"),
  );
  if (distinctDays(severeHotflash) >= 4) {
    advisories.push({
      id: "hotflash-frequent",
      tier: "notice",
      title: "Частые сильные приливы",
      message: `Сильные приливы отмечены 4 и более дней за неделю — если это мешает сну и повседневным делам, ${CLINICIAN_PHRASE}.`,
    });
  }

  const lowMood = recent.filter(
    (event) => event.chipId === "mood" && typeof event.scaleVal === "number" && event.scaleVal <= 2,
  );
  if (distinctDays(lowMood) >= 5) {
    advisories.push({
      id: "mood-persistent-low",
      tier: "discuss_soon",
      title: "Сниженное настроение сохраняется",
      message: `Сниженное настроение отмечено 5 и более дней за неделю — ${CLINICIAN_PHRASE}.`,
    });
  }

  const persistentCramps = recent.filter(
    (event) => event.chipId === "symptom" && (event.multiLabels ?? []).includes("Спазмы"),
  );
  if (distinctDays(persistentCramps) >= 5) {
    advisories.push({
      id: "cramps-persistent",
      tier: "notice",
      title: "Спазмы почти каждый день",
      message: `Спазмы отмечены 5 и более дней за неделю — если это сильнее обычного, ${CLINICIAN_PHRASE}.`,
    });
  }

  return advisories;
}
