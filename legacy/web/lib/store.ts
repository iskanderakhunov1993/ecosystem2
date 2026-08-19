import type { MiraLocalData, DailyCheckIn, WorkoutLog, UserProfile, IslamicEntry, CyclePhase, WaterEntry, WalkingEntry, WeightEntry } from "./types";
import { getCycleNorm } from "./cycleEngine";

const STORAGE_KEY = "mira:data";
const DATA_VERSION = 2;

// ── Date helpers ──

export function dateKey(date = new Date()): string {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 10);
}

// ── CRUD ──

export function createEmpty(): MiraLocalData {
  return {
    version: DATA_VERSION,
    checkIns: {},
    workouts: [],
    onboardingCompleted: false,
  };
}

export function readData(): MiraLocalData {
  if (typeof window === "undefined") return createEmpty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmpty();
    const parsed = JSON.parse(raw) as MiraLocalData;
    if (parsed.version !== DATA_VERSION) return createEmpty();
    return parsed;
  } catch {
    return createEmpty();
  }
}

export function writeData(data: MiraLocalData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ── Check-in helpers ──

export function saveCheckIn(data: MiraLocalData, checkIn: DailyCheckIn): MiraLocalData {
  return {
    ...data,
    checkIns: { ...data.checkIns, [checkIn.date]: checkIn },
  };
}

export function getCheckIn(data: MiraLocalData, date?: string): DailyCheckIn | undefined {
  return data.checkIns[date ?? dateKey()];
}

// ── Workout helpers ──

export function addWorkout(data: MiraLocalData, workout: Omit<WorkoutLog, "id" | "date">): MiraLocalData {
  return {
    ...data,
    workouts: [
      { ...workout, id: `w-${Date.now()}`, date: dateKey() },
      ...data.workouts,
    ],
  };
}

// ── Profile ──

export function saveProfile(data: MiraLocalData, profile: UserProfile): MiraLocalData {
  return { ...data, profile };
}

// ── Islamic entries ──

export function saveIslamicEntry(data: MiraLocalData, date: string, entry: IslamicEntry): MiraLocalData {
  return {
    ...data,
    islamicEntries: { ...data.islamicEntries, [date]: entry },
  };
}

export function getIslamicEntry(data: MiraLocalData, date?: string): IslamicEntry | undefined {
  return data.islamicEntries?.[date ?? dateKey()];
}

export function countQadaDays(data: MiraLocalData): number {
  if (!data.islamicEntries) return 0;
  let missed = 0;
  let madeUp = 0;
  for (const entry of Object.values(data.islamicEntries)) {
    if (entry.fasting === "missed" || entry.fasting === "exempt") missed++;
    if (entry.fasting === "makeup") madeUp++;
  }
  return Math.max(0, missed - madeUp);
}

export function countHaydDays(data: MiraLocalData): number {
  if (!data.islamicEntries) return 0;
  return Object.values(data.islamicEntries).filter(e => e.hayd).length;
}

export function isInHayd(data: MiraLocalData): boolean {
  return !!data.islamicEntries?.[dateKey()]?.hayd;
}

export function isInPurity(data: MiraLocalData): boolean {
  return !!data.islamicEntries?.[dateKey()]?.purity;
}

// ── Cycle calculations ──

export function getCycleDay(profile: UserProfile | undefined): number {
  if (!profile?.cycleConfig.periodStart) return 1;
  // Движок нормы: считает день цикла от реального последнего старта
  // и медианной длины из истории месячных, а не из онбординг-оценки.
  return getCycleNorm(profile).cycleDay;
}

export function getCyclePhase(day: number, periodLength = 5, cycleLength = 28): CyclePhase {
  if (day <= periodLength) return "menstruation";
  const remaining = cycleLength - periodLength;
  const follEnd = periodLength + Math.round(remaining * 0.4);
  const ovulEnd = follEnd + Math.round(remaining * 0.12);
  if (day <= follEnd) return "follicular";
  if (day <= ovulEnd) return "ovulation";
  return "luteal";
}

export function getPhaseLabel(phase: CyclePhase): string {
  const labels: Record<CyclePhase, string> = {
    menstruation: "Менструация",
    follicular: "Фолликулярная",
    ovulation: "Овуляция",
    luteal: "Лютеиновая",
  };
  return labels[phase];
}

export function getDaysUntilPeriod(profile: UserProfile | undefined): number {
  if (!profile) return 0;
  return getCycleNorm(profile).daysUntilPeriod;
}

// ── Water tracking ──

export function getWaterEntry(data: MiraLocalData, date?: string): WaterEntry {
  const key = date ?? dateKey();
  return data.waterLog?.[key] ?? { date: key, glasses: 0, goal: 8 };
}

export function addWaterGlass(data: MiraLocalData): MiraLocalData {
  const key = dateKey();
  const existing = getWaterEntry(data, key);
  return {
    ...data,
    waterLog: {
      ...data.waterLog,
      [key]: { ...existing, date: key, glasses: existing.glasses + 1 },
    },
  };
}

export function removeWaterGlass(data: MiraLocalData): MiraLocalData {
  const key = dateKey();
  const existing = getWaterEntry(data, key);
  return {
    ...data,
    waterLog: {
      ...data.waterLog,
      [key]: { ...existing, date: key, glasses: Math.max(0, existing.glasses - 1) },
    },
  };
}

// ── Walking tracking ──

export function getWalkingEntry(data: MiraLocalData, date?: string): WalkingEntry {
  const key = date ?? dateKey();
  return data.walkingLog?.[key] ?? { date: key, steps: 0, goal: 7000, source: "manual" };
}

export function saveWalkingEntry(data: MiraLocalData, entry: WalkingEntry): MiraLocalData {
  const normalized = {
    ...entry,
    steps: Math.max(0, Math.round(entry.steps)),
    goal: Math.max(1000, Math.round(entry.goal)),
    source: entry.source ?? "manual",
  };

  if (normalized.steps <= 0) {
    const walkingLog = { ...(data.walkingLog ?? {}) };
    delete walkingLog[entry.date];
    return {
      ...data,
      walkingLog,
    };
  }

  return {
    ...data,
    walkingLog: {
      ...data.walkingLog,
      [entry.date]: normalized,
    },
  };
}

export function addWalkingSteps(data: MiraLocalData, steps: number, date?: string): MiraLocalData {
  const existing = getWalkingEntry(data, date);
  return saveWalkingEntry(data, {
    ...existing,
    steps: Math.max(0, existing.steps + steps),
    source: "manual",
  });
}

// ── Weight tracking ──

export function getWeightEntry(data: MiraLocalData, date?: string): WeightEntry | undefined {
  const key = date ?? dateKey();
  return data.weightLog?.[key];
}

export function getLatestWeightEntry(data: MiraLocalData): WeightEntry | undefined {
  const entries = Object.values(data.weightLog ?? {});
  if (entries.length === 0) {
    const profileWeight = data.profile?.weight;
    return typeof profileWeight === "number" ? { date: dateKey(), weight: profileWeight } : undefined;
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getPreviousWeightEntry(data: MiraLocalData, beforeDate?: string): WeightEntry | undefined {
  const latestDate = beforeDate ?? getLatestWeightEntry(data)?.date;
  if (!latestDate) return undefined;
  const entries = Object.values(data.weightLog ?? {})
    .filter((entry) => entry.date < latestDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  return entries[0];
}

export function saveWeightEntry(data: MiraLocalData, entry: WeightEntry): MiraLocalData {
  const normalizedWeight = Math.round(entry.weight * 10) / 10;
  if (!Number.isFinite(normalizedWeight) || normalizedWeight < 25 || normalizedWeight > 250) return data;

  const profile = data.profile ? { ...data.profile, weight: normalizedWeight } : data.profile;
  return {
    ...data,
    profile,
    weightLog: {
      ...data.weightLog,
      [entry.date]: { ...entry, weight: normalizedWeight },
    },
  };
}
