import { useMemo } from "react";
import { Icon } from "@/data/icons";
import { dateKey, startOfDay } from "@/lib/derive";

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const MONTH_NAMES = [
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

/** Понедельник недели, в которую попадает дата. */
export function startOfWeek(ts: number): Date {
  const date = new Date(startOfDay(ts));
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

interface DayCellProps {
  date: Date;
  marked: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  onSelect: (ts: number) => void;
}

function DayCell({ date, marked, isToday, isSelected, isFuture, onSelect }: DayCellProps) {
  // Будущие дни не открываются: записи «наперёд» исказили бы всю аналитику.
  const disabled = isFuture;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(date.getTime())}
      aria-label={`${date.getDate()} ${MONTH_NAMES[date.getMonth()].toLowerCase()}`}
      aria-current={isToday ? "date" : undefined}
      className="flex flex-col items-center gap-1 py-1.5 disabled:opacity-30"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] transition ${
          isSelected
            ? "bg-accent text-[#16090C]"
            : isToday
              ? "bg-accent-soft text-accent-text"
              : "text-text-dim"
        }`}
      >
        {date.getDate()}
      </span>
      <span
        className={`h-1 w-1 rounded-full ${marked ? "bg-accent" : "bg-transparent"}`}
        aria-hidden="true"
      />
    </button>
  );
}

interface WeekStripProps {
  marked: Set<string>;
  selected: number;
  weekOffset: number;
  onSelect: (ts: number) => void;
  onWeekChange: (offset: number) => void;
}

/** Свёрнутый вид: неделя целиком, всегда на виду в «Сегодня». */
export function WeekStrip({ marked, selected, weekOffset, onSelect, onWeekChange }: WeekStripProps) {
  const todayKey = dateKey(Date.now());
  const selectedKey = dateKey(selected);
  const todayStart = startOfDay(Date.now());

  const days = useMemo(() => {
    const monday = startOfWeek(Date.now());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, [weekOffset]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Предыдущая неделя"
        onClick={() => onWeekChange(weekOffset - 1)}
        className="rotate-180 rounded-lg p-1 text-text-faint"
      >
        <Icon name="chevron" size={14} />
      </button>

      <div className="grid flex-1 grid-cols-7">
        {days.map((date) => {
          const key = dateKey(date.getTime());
          return (
            <span key={key} className="flex flex-col items-center">
              <span className="mono-label pb-1 text-[9px] text-text-faint">
                {WEEKDAYS[(date.getDay() + 6) % 7]}
              </span>
              <DayCell
                date={date}
                marked={marked.has(key)}
                isToday={key === todayKey}
                isSelected={key === selectedKey}
                isFuture={startOfDay(date.getTime()) > todayStart}
                onSelect={onSelect}
              />
            </span>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Следующая неделя"
        onClick={() => onWeekChange(Math.min(0, weekOffset + 1))}
        disabled={weekOffset >= 0}
        className="rounded-lg p-1 text-text-faint disabled:opacity-30"
      >
        <Icon name="chevron" size={14} />
      </button>
    </div>
  );
}

interface MonthCalendarProps {
  marked: Set<string>;
  selected: number;
  monthOffset: number;
  onSelect: (ts: number) => void;
}

/** Развёрнутый вид: месяц целиком. Скролл назад по месяцам — и есть история. */
export function MonthCalendar({ marked, selected, monthOffset, onSelect }: MonthCalendarProps) {
  const todayKey = dateKey(Date.now());
  const selectedKey = dateKey(selected);
  const todayStart = startOfDay(Date.now());

  const cells = useMemo(() => {
    const now = new Date();
    const cursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (cursor.getDay() + 6) % 7;
    const list: (Date | null)[] = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) list.push(new Date(year, month, day));
    return list;
  }, [monthOffset]);

  return (
    <div className="grid grid-cols-7 gap-y-1 text-center">
      {WEEKDAYS.map((day) => (
        <span key={day} className="mono-label pb-2 text-text-faint">
          {day}
        </span>
      ))}
      {cells.map((date, index) => {
        if (!date) return <span key={`empty-${index}`} />;
        const key = dateKey(date.getTime());
        return (
          <DayCell
            key={key}
            date={date}
            marked={marked.has(key)}
            isToday={key === todayKey}
            isSelected={key === selectedKey}
            isFuture={startOfDay(date.getTime()) > todayStart}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

export function monthTitle(monthOffset: number): string {
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
}
