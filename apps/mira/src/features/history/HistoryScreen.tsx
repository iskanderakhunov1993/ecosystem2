import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Icon } from "@/data/icons";
import { QUICK_LOG } from "@/data/modes.config";
import { dateKey, formatDayHeading, formatTime } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import type { LogEvent, Mode, Session } from "@/lib/types";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

interface TimelineItem {
  id: string;
  timestamp: number;
  title: string;
  detail: string;
}

function toTimeline(events: LogEvent[], sessions: Session[], mode: Mode): TimelineItem[] {
  const fromEvents = events.map((event) => ({
    id: event.id,
    timestamp: event.timestamp,
    title: QUICK_LOG[mode].find((chip) => chip.id === event.chipId)?.label ?? event.chipId,
    detail: event.summary,
  }));
  const fromSessions = sessions.map((session) => ({
    id: session.id,
    timestamp: session.timestamp,
    title: session.summary,
    detail: session.detail,
  }));
  return [...fromEvents, ...fromSessions].sort((a, b) => b.timestamp - a.timestamp);
}

export function HistoryScreen() {
  const mode = useAppStore((state) => state.mode);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const sessions = useAppStore((state) => state.sessions[state.mode]);

  const [monthOffset, setMonthOffset] = useState(0);

  const timeline = useMemo(() => toTimeline(events, sessions, mode), [events, sessions, mode]);

  /** Точка ставится только там, где реально есть запись. */
  const markedDays = useMemo(() => {
    const set = new Set<string>();
    for (const item of timeline) set.add(dateKey(item.timestamp));
    return set;
  }, [timeline]);

  const cursor = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;
    const list: (Date | null)[] = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) list.push(new Date(year, month, day));
    return list;
  }, [cursor]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const item of timeline) {
      const key = dateKey(item.timestamp);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()];
  }, [timeline]);

  const todayKey = dateKey(Date.now());

  return (
    <div className="space-y-4">
      <Card
        title={`${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`}
        action={
          <span className="flex gap-1">
            <button
              type="button"
              aria-label="Предыдущий месяц"
              onClick={() => setMonthOffset((value) => value - 1)}
              className="rotate-180 rounded-lg p-1.5 text-text-faint hover:text-text"
            >
              <Icon name="chevron" size={16} />
            </button>
            <button
              type="button"
              aria-label="Следующий месяц"
              onClick={() => setMonthOffset((value) => Math.min(0, value + 1))}
              disabled={monthOffset >= 0}
              className="rounded-lg p-1.5 text-text-faint hover:text-text disabled:opacity-40"
            >
              <Icon name="chevron" size={16} />
            </button>
          </span>
        }
      >
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day} className="mono-label pb-2 text-text-faint">
              {day}
            </span>
          ))}
          {cells.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />;
            const key = dateKey(date.getTime());
            const marked = markedDays.has(key);
            const isToday = key === todayKey;
            return (
              <span key={key} className="flex flex-col items-center gap-1 py-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${
                    isToday ? "bg-accent-soft text-accent-text" : "text-text-dim"
                  }`}
                >
                  {date.getDate()}
                </span>
                <span
                  className={`h-1 w-1 rounded-full ${marked ? "bg-accent" : "bg-transparent"}`}
                  aria-hidden="true"
                />
              </span>
            );
          })}
        </div>
      </Card>

      {grouped.length === 0 ? (
        <Card title="Хронология">
          <p className="text-[13px] leading-snug text-text-faint">
            История будет пополняться по мере использования — здесь появятся твои записи и сессии.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([key, items]) => (
            <Card key={key} title={formatDayHeading(items[0].timestamp)}>
              <ul className="space-y-3">
                {items.map((item) => (
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
