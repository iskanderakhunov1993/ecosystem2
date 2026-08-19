import type { UserProfile, CyclePhase } from "./types";

/* ──────────────────────────────────────────────
   Cycle Engine — реальная «личная норма»
   Считает длину цикла из истории стартов месячных,
   а не из статичной онбординг-оценки.
   ────────────────────────────────────────────── */

const MS_DAY = 86_400_000;

export type CycleNorm = {
  /** Эффективная длина цикла: медиана реальных, либо онбординг-оценка */
  cycleLength: number;
  /** Якорь — дата последнего начала месячных */
  lastPeriodStart: string;
  /** Текущий день цикла (1-based) */
  cycleDay: number;
  /** Дней до следующих месячных (по эффективной длине) */
  daysUntilPeriod: number;
  /** Задержка: цикл превысил ожидаемую длину */
  isDelayed: boolean;
  /** На сколько дней задержка */
  delayDays: number;
  /** Сколько завершённых циклов наблюдали */
  observedCycles: number;
  /** Разброс наблюдаемых длин (макс − мин), дней */
  spread: number;
  /** Минимальная и максимальная наблюдаемая длина */
  minLength: number;
  maxLength: number;
  /** Уверенность прогноза */
  confidence: "low" | "medium" | "high";
  /** Регулярный ли цикл (разброс ≤ 4 дня при 2+ циклах) */
  isRegular: boolean;
};

/** Отсортированный массив реальных стартов месячных (по возрастанию). */
function getStarts(profile: UserProfile | undefined): string[] {
  if (!profile) return [];
  const history = profile.cycleConfig.periodStarts ?? [];
  const set = new Set(history);
  // онбординг-дата тоже считается стартом, если истории нет
  if (profile.cycleConfig.periodStart) set.add(profile.cycleConfig.periodStart);
  return Array.from(set).sort();
}

/** Длины завершённых циклов = разницы между соседними стартами. */
function observedLengths(starts: string[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const diff = Math.round(
      (new Date(starts[i]).getTime() - new Date(starts[i - 1]).getTime()) / MS_DAY
    );
    // отсекаем мусор (двойные отметки, опечатки)
    if (diff >= 15 && diff <= 60) lengths.push(diff);
  }
  return lengths;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function getCycleNorm(profile: UserProfile | undefined): CycleNorm {
  const fallbackLength = profile?.cycleConfig.cycleLength ?? 28;
  const starts = getStarts(profile);
  const lengths = observedLengths(starts);

  const cycleLength = lengths.length >= 1 ? median(lengths) : fallbackLength;
  const lastPeriodStart = starts.length > 0
    ? starts[starts.length - 1]
    : (profile?.cycleConfig.periodStart ?? new Date().toISOString().slice(0, 10));

  // день цикла от последнего реального старта
  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(lastPeriodStart).getTime()) / MS_DAY)
  );

  // Если прошло меньше длины цикла — обычный ход.
  // Если больше — задержка (не «новый цикл»): день продолжает расти,
  // месячные «ожидаются со дня на день».
  const expectedDay = daysSince + 1;
  const isDelayed = expectedDay > cycleLength;
  const cycleDay = isDelayed ? expectedDay : expectedDay;
  const daysUntilPeriod = isDelayed ? 0 : cycleLength - daysSince;
  const delayDays = isDelayed ? expectedDay - cycleLength : 0;

  const minLength = lengths.length ? Math.min(...lengths) : cycleLength;
  const maxLength = lengths.length ? Math.max(...lengths) : cycleLength;
  const spread = maxLength - minLength;

  const observedCycles = lengths.length;
  const confidence: CycleNorm["confidence"] =
    observedCycles >= 3 ? "high" : observedCycles >= 1 ? "medium" : "low";
  const isRegular = observedCycles >= 2 && spread <= 4;

  return {
    cycleLength,
    lastPeriodStart,
    cycleDay,
    daysUntilPeriod,
    isDelayed,
    delayDays,
    observedCycles,
    spread,
    minLength,
    maxLength,
    confidence,
    isRegular,
  };
}

/** Прогноз начала месячных диапазоном на основе реального разброса. */
export function getPeriodForecast(profile: UserProfile | undefined): {
  daysUntil: number;
  rangeLow: number;
  rangeHigh: number;
  text: string;
} {
  const norm = getCycleNorm(profile);
  const daysUntil = norm.daysUntilPeriod;

  // разброс прогноза: реальный (spread/2) если есть данные, иначе ±2
  const margin = norm.observedCycles >= 2 ? Math.max(1, Math.ceil(norm.spread / 2)) : 2;
  const rangeLow = Math.max(0, daysUntil - margin);
  const rangeHigh = daysUntil + margin;

  let text: string;
  if (norm.isDelayed) text = norm.delayDays === 1 ? "задержка 1 день" : `задержка ${norm.delayDays} дн.`;
  else if (daysUntil <= 0) text = "ожидаются сегодня";
  else if (daysUntil === 1) text = "завтра";
  else if (margin === 0 || rangeLow === rangeHigh) text = `через ${daysUntil} дн.`;
  else text = `через ${rangeLow}–${rangeHigh} дней`;

  return { daysUntil, rangeLow, rangeHigh, text };
}

/** Добавить реальный старт месячных в историю (дедуп + сортировка). */
export function recordPeriodStart(profile: UserProfile, date: string): UserProfile {
  const history = profile.cycleConfig.periodStarts ?? [];
  // не добавляем дубль в пределах 10 дней от существующего старта
  const tooClose = history.some(
    h => Math.abs(new Date(h).getTime() - new Date(date).getTime()) < 10 * MS_DAY
  );
  const next = tooClose ? history : [...history, date].sort();

  return {
    ...profile,
    cycleConfig: {
      ...profile.cycleConfig,
      periodStarts: next,
      periodStart: next[next.length - 1] ?? date, // якорь = последний старт
    },
  };
}
