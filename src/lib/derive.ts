import type { Mode, Profile, Stage } from "@/lib/types";

/**
 * Профиль хранит значения на момент ввода (updatedAt). Чтобы дашборд не
 * «замерзал» на дне регистрации, время отсчитывается от этой точки.
 * Перименопауза — сознательное исключение: там держим качественную метку,
 * числового пересчёта не делаем.
 */

export const DAY_MS = 86_400_000;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysSince(anchor: number | undefined, now = Date.now()): number {
  if (!anchor) return 0;
  return Math.max(0, Math.floor((startOfDay(now) - startOfDay(anchor)) / DAY_MS));
}

function num(profile: Profile, key: string, fallback: number): number {
  const value = profile[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(profile: Profile, key: string): string | undefined {
  const value = profile[key];
  return typeof value === "string" ? value : undefined;
}

export type CyclePhase = "МЕНСТРУАЦИЯ" | "ФОЛЛИКУЛЯРНАЯ" | "ОВУЛЯЦИЯ" | "ЛЮТЕИНОВАЯ";

export interface CycleDerived {
  kind: "cycle";
  cycleLen: number;
  cycleDay: number;
  ovulationDay: number;
  phase: CyclePhase;
  daysToNextPeriod: number;
  nextPeriodDate: Date;
  fertileFrom: number;
  fertileTo: number;
  inFertileWindow: boolean;
  /** Дата последних месячных неизвестна — прогноз посчитан от даты записи, не от факта. */
  unknownStart?: boolean;
}

/** То же, что CycleDerived — вопрос пользователя другой («попали ли в окно»), поэтому свой kind. */
export interface FertilityDerived extends Omit<CycleDerived, "kind"> {
  kind: "fertility";
}

export interface PregnancyDerived {
  kind: "pregnancy";
  week: number;
  trimester: 1 | 2 | 3;
  weeksToBirth: number;
  dueDate: Date;
}

export interface PostpartumDerived {
  kind: "postpartum";
  daysAfter: number;
  week: number;
  daysToCheckup: number;
}

export interface MenopauseDerived {
  kind: "menopause";
  monthsSince: number;
}

export interface PerimenopauseDerived {
  kind: "perimenopause";
  irregularForLabel: string | undefined;
}

export interface UnknownDerived {
  kind: "unknown";
}

export type Derived =
  | CycleDerived
  | FertilityDerived
  | PregnancyDerived
  | PostpartumDerived
  | MenopauseDerived
  | PerimenopauseDerived
  | UnknownDerived;

export function deriveCycle(profile: Profile, now = Date.now()): CycleDerived {
  const cycleLen = Math.min(40, Math.max(21, Math.round(num(profile, "cycleLen", 28))));
  // "Не помню" пишет сентинел -1 в lastPeriodDays (см. modes.config.ts) — считаем от даты записи,
  // как будто менструация началась сегодня, но помечаем прогноз как ненадёжный.
  const unknownStart = str(profile, "lastPeriodDaysLabel") === "Не помню";
  const elapsed = (unknownStart ? 0 : num(profile, "lastPeriodDays", 0)) + daysSince(profile.updatedAt as number, now);
  const cycleDay = (elapsed % cycleLen) + 1;
  const ovulationDay = cycleLen - 14;

  let phase: CyclePhase;
  if (cycleDay <= 5) phase = "МЕНСТРУАЦИЯ";
  else if (Math.abs(cycleDay - ovulationDay) <= 1) phase = "ОВУЛЯЦИЯ";
  else if (cycleDay < ovulationDay) phase = "ФОЛЛИКУЛЯРНАЯ";
  else phase = "ЛЮТЕИНОВАЯ";

  const daysToNextPeriod = cycleLen - cycleDay + 1;
  const fertileFrom = Math.max(1, ovulationDay - 5);
  const fertileTo = Math.min(cycleLen, ovulationDay + 1);

  return {
    kind: "cycle",
    cycleLen,
    cycleDay,
    ovulationDay,
    phase,
    daysToNextPeriod,
    nextPeriodDate: new Date(startOfDay(now) + daysToNextPeriod * DAY_MS),
    fertileFrom,
    fertileTo,
    inFertileWindow: cycleDay >= fertileFrom && cycleDay <= fertileTo,
    unknownStart,
  };
}

export function derivePregnancy(profile: Profile, now = Date.now()): PregnancyDerived {
  const entered = num(profile, "week", 8);
  const week = Math.min(40, Math.max(1, entered + Math.floor(daysSince(profile.updatedAt as number, now) / 7)));
  const trimester: 1 | 2 | 3 = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const weeksToBirth = Math.max(0, 40 - week);
  return {
    kind: "pregnancy",
    week,
    trimester,
    weeksToBirth,
    dueDate: new Date(startOfDay(now) + weeksToBirth * 7 * DAY_MS),
  };
}

export function derivePostpartum(profile: Profile, now = Date.now()): PostpartumDerived {
  const daysAfter = Math.max(
    1,
    num(profile, "daysAfter", 14) + daysSince(profile.updatedAt as number, now),
  );
  return {
    kind: "postpartum",
    daysAfter,
    week: Math.ceil(daysAfter / 7),
    daysToCheckup: Math.max(0, 42 - daysAfter),
  };
}

export function deriveMenopause(profile: Profile, now = Date.now()): MenopauseDerived {
  const monthsSince =
    num(profile, "monthsSince", 12) + Math.floor(daysSince(profile.updatedAt as number, now) / 30);
  return { kind: "menopause", monthsSince };
}

export function deriveFertility(profile: Profile, now = Date.now()): FertilityDerived {
  return { ...deriveCycle(profile, now), kind: "fertility" };
}

export function derive(mode: Mode, stage: Stage | undefined, profile: Profile, now = Date.now()): Derived {
  switch (mode) {
    case "cycle":
      return deriveCycle(profile, now);
    case "fertility":
      return deriveFertility(profile, now);
    case "motherhood":
      switch (stage) {
        case "postpartum":
          return derivePostpartum(profile, now);
        case "pregnancy":
        default:
          return derivePregnancy(profile, now);
      }
    case "menopause":
      switch (stage) {
        case "perimenopause":
          return { kind: "perimenopause", irregularForLabel: str(profile, "irregularFor") };
        case "menopause":
        default:
          return deriveMenopause(profile, now);
      }
    default:
      return { kind: "unknown" };
  }
}

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function formatDate(ts: number | Date): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDayHeading(ts: number, now = Date.now()): string {
  const diff = daysSince(ts, now);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Вчера";
  return formatDate(ts);
}

/**
 * Окно неопределённости прогноза месячных, дней в каждую сторону.
 * Чем меньше отслеженных циклов и чем они разнообразнее по длине —
 * тем шире окно. Перенесено из практики соседнего проекта (new-mira),
 * где эта формула откалибрована на реальных данных.
 */
export function predictionUncertainty(cycleLengths: number[]): number {
  if (cycleLengths.length === 0) return 3;
  if (cycleLengths.length <= 2) return 2;
  const spread = Math.max(...cycleLengths) - Math.min(...cycleLengths);
  return Math.max(1, Math.ceil(spread / 2));
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
