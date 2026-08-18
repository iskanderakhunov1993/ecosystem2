import type { LogEvent, Session } from "@/lib/types";
import { dateKey, startOfDay } from "@/lib/derive";

export interface FrequencyItem {
  label: string;
  count: number;
}

/** Частота меток multi-select событий. Пустой массив = показывать empty-state. */
export function labelFrequency(events: LogEvent[], chipIds?: string[]): FrequencyItem[] {
  const tally = new Map<string, number>();
  for (const event of events) {
    if (chipIds && !chipIds.includes(event.chipId)) continue;
    for (const label of event.multiLabels ?? []) {
      tally.set(label, (tally.get(label) ?? 0) + 1);
    }
  }
  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export interface SeriesPoint {
  ts: number;
  value: number;
}

export function scaleSeries(events: LogEvent[], chipId: string): SeriesPoint[] {
  return events
    .filter((event) => event.chipId === chipId && typeof event.scaleVal === "number")
    .map((event) => ({ ts: event.timestamp, value: event.scaleVal as number }))
    .sort((a, b) => a.ts - b.ts);
}

export function numericSeries(events: LogEvent[], chipId: string): SeriesPoint[] {
  return events
    .filter((event) => event.chipId === chipId && typeof event.numericVal === "number")
    .map((event) => ({ ts: event.timestamp, value: event.numericVal as number }))
    .sort((a, b) => a.ts - b.ts);
}

/** Сколько разных дней содержат хотя бы одну запись — «дней с записями». */
export function activeDays(events: LogEvent[], sessions: Session[] = []): number {
  const days = new Set<string>();
  for (const event of events) days.add(dateKey(event.timestamp));
  for (const session of sessions) days.add(dateKey(session.timestamp));
  return days.size;
}

export function optionFrequency(events: LogEvent[], chipId: string): FrequencyItem[] {
  const tally = new Map<string, number>();
  for (const event of events) {
    if (event.chipId !== chipId) continue;
    if (event.multiLabels?.length) continue;
    tally.set(event.summary, (tally.get(event.summary) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function chipFrequency(events: LogEvent[]): Map<string, number> {
  const tally = new Map<string, number>();
  for (const event of events) tally.set(event.chipId, (tally.get(event.chipId) ?? 0) + 1);
  return tally;
}

/**
 * Начала циклов, восстановленные из реальных логов выделений:
 * запись flow после паузы в 15+ дней считается началом нового цикла.
 * Без таких данных длины циклов не считаются — и график остаётся пустым.
 */
export function detectCycleLengths(events: LogEvent[]): number[] {
  const flowDays = [
    ...new Set(
      events
        .filter((event) => event.chipId === "flow" && !/сух/i.test(event.summary))
        .map((event) => startOfDay(event.timestamp)),
    ),
  ].sort((a, b) => a - b);

  const starts: number[] = [];
  for (const day of flowDays) {
    const previous = starts[starts.length - 1];
    if (previous === undefined || day - previous >= 15 * 86_400_000) starts.push(day);
  }

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i += 1) {
    lengths.push(Math.round((starts[i] - starts[i - 1]) / 86_400_000));
  }
  return lengths;
}

/** Средние значения по неделям — для долгосрочных трендов (вес, БТ). */
export function weeklyAverages(points: SeriesPoint[]): SeriesPoint[] {
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const point of points) {
    const week = Math.floor(startOfDay(point.ts) / (7 * 86_400_000));
    const bucket = buckets.get(week) ?? { sum: 0, count: 0 };
    bucket.sum += point.value;
    bucket.count += 1;
    buckets.set(week, bucket);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, bucket]) => ({ ts: week * 7 * 86_400_000, value: bucket.sum / bucket.count }));
}
