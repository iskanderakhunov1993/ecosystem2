import { QUICK_LOG } from "@/data/modes.config";
import { chipFrequency, detectCycleLengths, labelFrequency } from "@/features/analytics/aggregations";
import { computePatterns } from "@/features/patterns/computePatterns";
import { dateKey, derive, formatDate, pluralRu, predictionUncertainty } from "@/lib/derive";
import { evaluateSafety } from "@/lib/safety";
import type { LogEvent, Mode, Profile, Session } from "@/lib/types";

const DAY_MS = 86_400_000;

/** Категории, которые не попадают в файл без явного согласия. */
export type ShareKey = "cycle" | "pain" | "mood" | "sleep" | "notes" | "intimacy";

export interface ShareOption {
  key: ShareKey;
  label: string;
  count: number;
  /** Чувствительные категории сняты по умолчанию — решает пользователь. */
  sensitive: boolean;
}

export interface ReportFact {
  label: string;
  value: string;
  /** Отклонение — помечается цветом, но не трактуется как диагноз. */
  flagged?: boolean;
}

export interface DoctorReport {
  periodLabel: string;
  totalEvents: number;
  activeDays: number;
  /** Наблюдения, которые человек сам мог не связать. Пусто — значит блока нет. */
  worthShowing: { title: string; message: string }[];
  facts: ReportFact[];
  questions: string[];
  shareOptions: ShareOption[];
}

const RANGE_DAYS: Record<string, number> = { "1m": 30, "3m": 90, "6m": 180, all: Number.MAX_SAFE_INTEGER };

export type RangeKey = keyof typeof RANGE_DAYS;

export const RANGE_LABELS: { key: RangeKey; label: string }[] = [
  { key: "1m", label: "Месяц" },
  { key: "3m", label: "3 месяца" },
  { key: "6m", label: "6 месяцев" },
  { key: "all", label: "Всё" },
];

function inRange(items: { timestamp: number }[], range: RangeKey, now: number) {
  const days = RANGE_DAYS[range];
  if (days === Number.MAX_SAFE_INTEGER) return items;
  return items.filter((item) => item.timestamp >= now - days * DAY_MS);
}

/** Ищет чип, отвечающий за боль/симптомы, — id отличаются между режимами. */
function painChipId(mode: Mode): string | null {
  const chip = QUICK_LOG[mode].find((item) => /symptom|pain|hotflash/.test(item.id));
  return chip?.id ?? null;
}

export function buildReport(
  mode: Mode,
  profile: Profile,
  allEvents: LogEvent[],
  allSessions: Session[],
  range: RangeKey,
  now = Date.now()
): DoctorReport {
  const events = inRange(allEvents, range, now) as LogEvent[];
  const sessions = inRange(allSessions, range, now) as Session[];

  const days = new Set(events.map((event) => dateKey(event.timestamp)));
  for (const session of sessions) days.add(dateKey(session.timestamp));

  const counts = chipFrequency(events);
  const painId = painChipId(mode);
  const painCount = painId ? counts.get(painId) ?? 0 : 0;

  /* ── Что стоит показать ──
     Блок появляется только если есть что показать. Пустым не бывает. */
  const worthShowing = evaluateSafety(mode, events, now).map((advisory) => ({
    title: advisory.title,
    message: advisory.message,
  }));

  const patterns = computePatterns(events, mode);
  for (const pattern of patterns.slice(0, 2)) {
    worthShowing.push({ title: pattern.title, message: pattern.detail });
  }

  /* ── Главное: цифрами, в привычном врачу виде ── */
  const facts: ReportFact[] = [];
  const data = derive(mode, profile, now);

  if (data.kind === "cycle") {
    const lengths = detectCycleLengths(allEvents);
    const spread = predictionUncertainty(lengths);
    facts.push({
      label: "Длина цикла",
      value: lengths.length
        ? `${Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length)} дн ±${spread}`
        : `${data.cycleLen} дн (по анкете)`,
      flagged: spread >= 7,
    });
    facts.push({ label: "Отслежено циклов", value: String(lengths.length) });
    facts.push({ label: "День цикла сейчас", value: String(data.cycleDay) });
  }
  if (data.kind === "pregnancy") {
    facts.push({ label: "Срок", value: `${data.week} нед` });
    facts.push({ label: "ПДР", value: formatDate(data.dueDate) });
  }
  if (data.kind === "postpartum") {
    facts.push({ label: "После родов", value: `${data.daysAfter} дн` });
  }
  if (data.kind === "menopause") {
    facts.push({ label: "Без менструации", value: `${data.monthsSince} мес` });
  }

  facts.push({ label: "Дней с записями", value: `${days.size} из ${events.length ? days.size : 0}` });
  if (painId) {
    facts.push({
      label: "Дней с симптомами",
      value: String(painCount),
      flagged: painCount >= 8,
    });
  }

  const topSymptoms = labelFrequency(events, painId ? [painId] : undefined).slice(0, 3);
  if (topSymptoms.length) {
    facts.push({
      label: "Чаще всего",
      value: topSymptoms.map((item) => `${item.label} (${item.count})`).join(", "),
    });
  }

  /* ── Вопросы: формулируются вопросами, а не утверждениями ── */
  const questions: string[] = [];
  if (painCount >= 8) questions.push("Симптомы повторяются каждый цикл — это норма для меня?");
  if (data.kind === "cycle") {
    const lengths = detectCycleLengths(allEvents);
    if (predictionUncertainty(lengths) >= 7) {
      questions.push("Цикл нерегулярный — нужно ли обследование?");
    }
    if (lengths.length < 3) {
      questions.push("Сколько циклов нужно отследить, чтобы разговор был предметным?");
    }
  }
  questions.push("Какие анализы имеет смысл сдать?");

  /* ── Что включить в файл ── */
  const shareOptions: ShareOption[] = [
    { key: "cycle", label: "Даты месячных и длина цикла", count: detectCycleLengths(allEvents).length, sensitive: false },
    { key: "pain", label: "Боль и симптомы", count: painCount, sensitive: false },
    { key: "mood", label: "Настроение и энергия", count: events.filter((event) => event.scaleVal !== undefined).length, sensitive: false },
    { key: "sleep", label: "Сон", count: counts.get("sleep") ?? 0, sensitive: false },
    { key: "notes", label: "Заметки своими словами", count: events.filter((event) => event.summary.length > 40).length, sensitive: true },
    { key: "intimacy", label: "Секс и контрацепция", count: counts.get("sex") ?? counts.get("intimacy") ?? 0, sensitive: true },
  ];

  const from = range === "all" ? undefined : new Date(now - RANGE_DAYS[range] * DAY_MS);
  const periodLabel = from ? `${formatDate(from)} — ${formatDate(new Date(now))}` : "За всё время";

  return {
    periodLabel,
    totalEvents: events.length,
    activeDays: days.size,
    worthShowing,
    facts,
    questions,
    shareOptions,
  };
}

/** Текстовый файл — то, что реально можно распечатать и принести на приём. */
export function reportToText(report: DoctorReport, selected: Set<ShareKey>): string {
  const lines: string[] = [];
  lines.push("MIRA — ОТЧЁТ ДЛЯ ВРАЧА");
  lines.push(report.periodLabel);
  lines.push(`${report.activeDays} ${pluralRu(report.activeDays, "день", "дня", "дней")} с записями`);
  lines.push("");
  lines.push("Отчёт показывает наблюдения пользователя и не ставит диагноз.");
  lines.push("Данные могут быть неполными, если дни не заполнялись.");
  lines.push("");

  if (report.worthShowing.length) {
    lines.push("СТОИТ ОБСУДИТЬ");
    for (const item of report.worthShowing) lines.push(`— ${item.title}. ${item.message}`);
    lines.push("");
  }

  lines.push("ГЛАВНОЕ");
  for (const fact of report.facts) lines.push(`${fact.label}: ${fact.value}`);
  lines.push("");

  lines.push("ВОПРОСЫ НА ПРИЁМ");
  for (const question of report.questions) lines.push(`— ${question}`);
  lines.push("");

  const excluded = report.shareOptions.filter((option) => !selected.has(option.key));
  if (excluded.length) {
    lines.push(`Не включено по решению пользователя: ${excluded.map((item) => item.label.toLowerCase()).join(", ")}.`);
  }

  return lines.join("\n");
}
