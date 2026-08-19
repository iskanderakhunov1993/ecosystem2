import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { MonthCalendar, WeekStrip, monthTitle } from "@/components/Calendar";
import { Ring } from "@/components/Ring";
import { SafetyBanner } from "@/components/SafetyBanner";
import { Icon } from "@/data/icons";
import { getQuickLog, MODE_LABELS, STAGE_LABELS } from "@/data/modes.config";
import { dateKey, derive, formatDate, formatDayHeading, formatTime, pluralRu, startOfDay } from "@/lib/derive";
import { evaluateSafety } from "@/lib/safety";
import { useAppStore } from "@/store/appStore";
import { stageOf } from "@/lib/types";
import type { LogEvent, Mode, Profile, Session, Stage } from "@/lib/types";

interface HeroData {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  caption: string;
  segment?: { from: number; to: number };
}

function heroFor(mode: Mode, stage: Stage | undefined, profile: Profile): HeroData {
  const data = derive(mode, stage, profile);

  switch (data.kind) {
    case "cycle": {
      if (data.unknownStart) {
        return {
          value: 0,
          max: 1,
          label: "~",
          sublabel: "СТАРТ ЦИКЛА НЕИЗВЕСТЕН",
          caption: "Отметь начало следующей менструации — тогда появится прогноз.",
        };
      }
      return {
        value: data.cycleDay,
        max: data.cycleLen,
        label: String(data.cycleDay),
        sublabel: `${data.phase} · ДЕНЬ ${data.cycleDay}`,
        caption: `До следующей менструации ${data.daysToNextPeriod} ${pluralRu(data.daysToNextPeriod, "день", "дня", "дней")} — ожидается ${formatDate(data.nextPeriodDate)}.`,
        segment: { from: data.fertileFrom, to: data.fertileTo },
      };
    }
    case "fertility": {
      if (data.unknownStart) {
        return {
          value: 0,
          max: 1,
          label: "~",
          sublabel: "СТАРТ ЦИКЛА НЕИЗВЕСТЕН",
          caption: "Отметь начало следующей менструации — тогда появится окно фертильности.",
        };
      }
      const sublabel = data.inFertileWindow ? "ОКНО ФЕРТИЛЬНОСТИ" : data.phase;
      return {
        value: data.cycleDay,
        max: data.cycleLen,
        label: String(data.cycleDay),
        sublabel: `${sublabel} · ДЕНЬ ${data.cycleDay}`,
        caption: `Окно фертильности: дни ${data.fertileFrom}–${data.fertileTo}. Следующая менструация ожидается ${formatDate(data.nextPeriodDate)}.`,
        segment: { from: data.fertileFrom, to: data.fertileTo },
      };
    }
    case "pregnancy":
      return {
        value: data.week,
        max: 40,
        label: String(data.week),
        sublabel: `ТРИМЕСТР ${data.trimester} · НЕДЕЛЯ ${data.week}`,
        caption: `До родов примерно ${data.weeksToBirth} ${pluralRu(data.weeksToBirth, "неделя", "недели", "недель")} — ориентировочно ${formatDate(data.dueDate)}.`,
      };
    case "postpartum":
      return {
        value: Math.min(data.daysAfter, 42),
        max: 42,
        label: String(data.week),
        sublabel: `НЕДЕЛЯ ${data.week} ПОСЛЕ РОДОВ`,
        caption:
          data.daysToCheckup > 0
            ? `До планового осмотра ${data.daysToCheckup} ${pluralRu(data.daysToCheckup, "день", "дня", "дней")}.`
            : "Срок планового осмотра уже наступил.",
      };
    case "menopause":
      return {
        value: Math.min(data.monthsSince, 60),
        max: 60,
        label: String(data.monthsSince),
        sublabel: "МЕСЯЦЕВ БЕЗ МЕНСТРУАЦИИ",
        caption: "Трекинг сосредоточен на приливах, сне и самочувствии.",
      };
    case "perimenopause":
      return {
        value: 0,
        max: 1,
        label: "~",
        sublabel: "ЦИКЛ НЕРЕГУЛЯРЕН",
        caption: data.irregularForLabel
          ? `Нерегулярность отмечена: ${data.irregularForLabel}. Числовой прогноз дня цикла здесь сознательно не строится.`
          : "Числовой прогноз дня цикла здесь сознательно не строится.",
      };
    default:
      return { value: 0, max: 1, label: "—", sublabel: "НЕТ ДАННЫХ", caption: "" };
  }
}

interface TodayEntry {
  chipId: string;
  label: string;
  summary: string;
  timestamp: number;
}

function todaySnapshot(events: LogEvent[], mode: Mode, stage: Stage | undefined, now = Date.now()): TodayEntry[] {
  const from = startOfDay(now);
  const latest = new Map<string, LogEvent>();
  for (const event of events) {
    if (event.timestamp < from) continue;
    latest.set(event.chipId, event);
  }
  return [...latest.values()]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((event) => ({
      chipId: event.chipId,
      label: getQuickLog(mode, stage).find((chip) => chip.id === event.chipId)?.label ?? event.chipId,
      summary: event.summary,
      timestamp: event.timestamp,
    }));
}

function todaySessions(sessions: Session[], now = Date.now()): Session[] {
  const from = startOfDay(now);
  return sessions.filter((session) => session.timestamp >= from).sort((a, b) => b.timestamp - a.timestamp);
}

interface DayItem {
  id: string;
  timestamp: number;
  title: string;
  detail: string;
}

/** Всё, что записано в конкретный день: и отметки, и сессии. */
function itemsForDay(events: LogEvent[], sessions: Session[], mode: Mode, stage: Stage | undefined, day: number): DayItem[] {
  const key = dateKey(day);
  const fromEvents = events
    .filter((event) => dateKey(event.timestamp) === key)
    .map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      title: getQuickLog(mode, stage).find((chip) => chip.id === event.chipId)?.label ?? event.chipId,
      detail: event.summary,
    }));
  const fromSessions = sessions
    .filter((session) => dateKey(session.timestamp) === key)
    .map((session) => ({
      id: session.id,
      timestamp: session.timestamp,
      title: session.summary,
      detail: session.detail,
    }));
  return [...fromEvents, ...fromSessions].sort((a, b) => b.timestamp - a.timestamp);
}

export function TodayScreen() {
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile[state.mode]);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const sessions = useAppStore((state) => state.sessions[state.mode]);
  const openSheet = useAppStore((state) => state.openSheet);
  const undoBanner = useAppStore((state) => state.undoBanner);
  const undoModeSwitch = useAppStore((state) => state.undoModeSwitch);
  const dismissUndoBanner = useAppStore((state) => state.dismissUndoBanner);

  const [expanded, setExpanded] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(Date.now()));

  const stage = stageOf(profile);
  const hero = useMemo(() => heroFor(mode, stage, profile), [mode, stage, profile]);
  const entries = useMemo(() => todaySnapshot(events, mode, stage), [events, mode, stage]);
  const sessionsToday = useMemo(() => todaySessions(sessions), [sessions]);
  const loggedChipIds = new Set(entries.map((entry) => entry.chipId));
  const safetyAdvisories = useMemo(() => evaluateSafety(mode, stage, events), [mode, stage, events]);

  /** Точка под числом ставится только там, где реально есть запись. */
  const markedDays = useMemo(() => {
    const set = new Set<string>();
    for (const event of events) set.add(dateKey(event.timestamp));
    for (const session of sessions) set.add(dateKey(session.timestamp));
    return set;
  }, [events, sessions]);

  const isToday = dateKey(selectedDay) === dateKey(Date.now());
  const selectedItems = useMemo(
    () => (isToday ? [] : itemsForDay(events, sessions, mode, stage, selectedDay)),
    [isToday, events, sessions, mode, stage, selectedDay]
  );

  const selectDay = (ts: number) => {
    setSelectedDay(startOfDay(ts));
    if (!expanded) setExpanded(true);
  };

  return (
    <div className="space-y-4">
      {undoBanner && (
        <div className="flex items-center gap-3 rounded-card border border-accent/40 bg-accent-soft px-4 py-3">
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-text">
            Переключили на «{undoBanner.from === undoBanner.to && undoBanner.toStage
              ? STAGE_LABELS[undoBanner.toStage]
              : MODE_LABELS[undoBanner.to]}».
          </p>
          <button
            type="button"
            onClick={undoModeSwitch}
            className="shrink-0 text-[13px] font-medium text-accent-text underline underline-offset-2"
          >
            Отменить
          </button>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={dismissUndoBanner}
            className="shrink-0 text-text-dim"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {safetyAdvisories.map((advisory) => (
        <SafetyBanner key={advisory.id} advisory={advisory} />
      ))}

      {/* Календарь живёт здесь, а не отдельной вкладкой: он нужен в момент отметки —
          «я забыла отметить позавчера» решается одним тапом, не уходя с экрана. */}
      <section className="rounded-card border border-border bg-surface p-3">
        <header className="mb-2 flex items-center justify-between gap-3 px-1">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 text-text-dim"
          >
            <span className="mono-label">{expanded ? monthTitle(monthOffset) : "Календарь"}</span>
            <span className={`transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`}>
              <Icon name="chevron" size={14} />
            </span>
          </button>

          {expanded ? (
            <span className="flex gap-1">
              <button
                type="button"
                aria-label="Предыдущий месяц"
                onClick={() => setMonthOffset((value) => value - 1)}
                className="rotate-180 rounded-lg p-1.5 text-text-faint"
              >
                <Icon name="chevron" size={16} />
              </button>
              <button
                type="button"
                aria-label="Следующий месяц"
                onClick={() => setMonthOffset((value) => Math.min(0, value + 1))}
                disabled={monthOffset >= 0}
                className="rounded-lg p-1.5 text-text-faint disabled:opacity-40"
              >
                <Icon name="chevron" size={16} />
              </button>
            </span>
          ) : (
            !isToday && (
              <button
                type="button"
                onClick={() => setSelectedDay(startOfDay(Date.now()))}
                className="text-[12px] text-accent-text underline underline-offset-2"
              >
                Сегодня
              </button>
            )
          )}
        </header>

        {expanded ? (
          <MonthCalendar
            marked={markedDays}
            selected={selectedDay}
            monthOffset={monthOffset}
            onSelect={(ts) => setSelectedDay(startOfDay(ts))}
          />
        ) : (
          <WeekStrip
            marked={markedDays}
            selected={selectedDay}
            weekOffset={weekOffset}
            onSelect={selectDay}
            onWeekChange={setWeekOffset}
          />
        )}

        {/* Выбран прошлый день — показываем, что в нём записано, и даём дозаполнить. */}
        {!isToday && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mono-label mb-2 text-text-faint">{formatDayHeading(selectedDay)}</p>
            {selectedItems.length === 0 ? (
              <p className="text-[13px] leading-snug text-text-faint">
                В этот день записей нет. Можно дозаполнить — это не поздно.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {selectedItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span className="mono-label mt-0.5 w-[38px] shrink-0 text-text-faint">
                      {formatTime(item.timestamp)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-text">{item.title}</span>
                      <span className="block text-[12px] leading-snug text-text-dim">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {getQuickLog(mode, stage).map((chip) => (
                <Chip
                  key={chip.id}
                  icon={chip.icon}
                  label={chip.label}
                  onClick={() => openSheet({ type: "log", chipId: chip.id, date: selectedDay })}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col items-center rounded-card border border-border bg-surface px-4 py-6">
        <Ring
          value={hero.value}
          max={hero.max}
          label={hero.label}
          sublabel={hero.sublabel}
          segment={mode === "fertility" ? hero.segment : undefined}
        />
        {hero.caption && (
          <p className="mt-5 max-w-[320px] text-center text-[13px] leading-snug text-text-dim">
            {hero.caption}
          </p>
        )}
      </section>

      <Card title="Быстрая запись">
        <div className="grid grid-cols-5 gap-1.5">
          {getQuickLog(mode, stage).map((chip) => (
            <Chip
              key={chip.id}
              icon={chip.icon}
              label={chip.label}
              logged={loggedChipIds.has(chip.id)}
              onClick={() => openSheet({ type: "log", chipId: chip.id })}
            />
          ))}
        </div>
      </Card>

      <Card title="Записано сегодня">
        {entries.length === 0 && sessionsToday.length === 0 ? (
          <p className="text-[13px] leading-snug text-text-faint">
            Пока пусто. Тапни по чипу выше — запись появится здесь.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {entries.map((entry) => (
              <li key={entry.chipId} className="flex items-start gap-3">
                <span className="mono-label mt-0.5 w-[38px] shrink-0 text-text-faint">
                  {formatTime(entry.timestamp)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-text">{entry.label}</span>
                  <span className="block text-[12px] leading-snug text-text-dim">{entry.summary}</span>
                </span>
              </li>
            ))}
            {sessionsToday.map((session) => (
              <li key={session.id} className="flex items-start gap-3">
                <span className="mono-label mt-0.5 w-[38px] shrink-0 text-text-faint">
                  {formatTime(session.timestamp)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-text">{session.summary}</span>
                  <span className="block text-[12px] leading-snug text-text-dim">{session.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
