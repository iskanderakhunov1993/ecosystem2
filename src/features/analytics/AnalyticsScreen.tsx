import { useMemo } from "react";
import { BarList } from "@/components/BarList";
import { Card } from "@/components/Card";
import { DonutStat } from "@/components/DonutStat";
import { EmptyChartCard } from "@/components/EmptyChartCard";
import { KpiCard } from "@/components/KpiCard";
import { LineChart } from "@/components/LineChart";
import { derive } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import type { LogEvent, Mode, Profile, Session } from "@/lib/types";
import {
  activeDays,
  detectCycleLengths,
  labelFrequency,
  numericSeries,
  scaleSeries,
  weeklyAverages,
} from "./aggregations";

interface Kpi {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

/** KPI из профиля показываем сразу — это то, что пользователь ввёл сам. */
function modeKpis(mode: Mode, profile: Profile, events: LogEvent[]): Kpi[] {
  const data = derive(mode, profile);
  const cycleLengths = detectCycleLengths(events);

  switch (data.kind) {
    case "cycle": {
      const regularity =
        cycleLengths.length >= 2
          ? `${Math.round(
              (1 -
                (Math.max(...cycleLengths) - Math.min(...cycleLengths)) /
                  Math.max(...cycleLengths)) *
                100,
            )}`
          : "—";
      return [
        { label: "Длина цикла", value: String(data.cycleLen), unit: "дней" },
        { label: "День цикла", value: String(data.cycleDay) },
        {
          label: "Регулярность",
          value: regularity,
          unit: "%",
          note: regularity === "—" ? "Появится после 2+ отслеженных циклов" : undefined,
        },
      ];
    }
    case "pregnancy":
      return [
        { label: "Текущий срок", value: String(data.week), unit: "нед" },
        { label: "Триместр", value: String(data.trimester) },
        { label: "До родов", value: String(data.weeksToBirth), unit: "нед" },
      ];
    case "postpartum":
      return [
        { label: "После родов", value: String(data.daysAfter), unit: "дн" },
        { label: "Неделя", value: String(data.week) },
        { label: "До осмотра", value: String(data.daysToCheckup), unit: "дн" },
      ];
    case "menopause":
      return [{ label: "Без менструации", value: String(data.monthsSince), unit: "мес" }];
    case "perimenopause":
      return [
        { label: "Нерегулярность", value: data.irregularForLabel ?? "—" },
        {
          label: "Длина цикла",
          value: "—",
          note: "Не считаем, пока цикл нерегулярен — это было бы ложной точностью",
        },
      ];
    default:
      return [];
  }
}

function useAnalytics(mode: Mode, events: LogEvent[], sessions: Session[]) {
  return useMemo(() => {
    const symptomFreq = labelFrequency(events, ["symptom", "more"]);
    const triggerFreq = labelFrequency(events, ["hotflash"]);
    const mood = scaleSeries(events, "mood");
    const bbt = numericSeries(events, "bbt");
    const weight = numericSeries(events, "weight");
    const weightWeekly = weeklyAverages(weight);
    const cycleLengths = detectCycleLengths(events);

    return {
      days: activeDays(events, sessions),
      symptomFreq,
      triggerFreq,
      mood,
      bbt,
      weight,
      weightWeekly,
      cycleLengths,
      isCycleLike: mode === "cycle" || mode === "ttc" || mode === "perimenopause",
    };
  }, [mode, events, sessions]);
}

export function AnalyticsScreen() {
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile[state.mode]);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const sessions = useAppStore((state) => state.sessions[state.mode]);

  const stats = useAnalytics(mode, events, sessions);
  const kpis = useMemo(() => modeKpis(mode, profile, events), [mode, profile, events]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Записей сделано" value={String(events.length)} />
        <KpiCard label="Дней с записями" value={String(stats.days)} />
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {events.length > 0 && (
        <Card title="Активность">
          <DonutStat
            value={stats.days}
            total={Math.max(stats.days, 30)}
            caption={`${stats.days} из последних 30 дней с записями`}
            sub="Процент считается по реальным дням, в которые ты что-то отметила."
          />
        </Card>
      )}

      {stats.symptomFreq.length >= 2 ? (
        <Card title="Частота отметок">
          <BarList items={stats.symptomFreq.slice(0, 6)} />
        </Card>
      ) : (
        <EmptyChartCard
          title="Частота отметок"
          hint="Нужно минимум 2 записи с несколькими отметками — тогда здесь появится частотный график."
        />
      )}

      {(mode === "perimenopause" || mode === "menopause") &&
        (stats.triggerFreq.length >= 2 ? (
          <Card title="Триггеры приливов">
            <BarList items={stats.triggerFreq.slice(0, 6)} />
          </Card>
        ) : (
          <EmptyChartCard
            title="Триггеры приливов"
            hint="Отметь триггеры хотя бы в двух записях о приливах — тогда появится распределение."
          />
        ))}

      {stats.mood.length >= 2 ? (
        <Card title="Динамика настроения">
          <LineChart points={stats.mood} min={1} max={5} />
        </Card>
      ) : (
        <EmptyChartCard
          title="Динамика настроения"
          hint="График строится по реальной последовательности отметок настроения — нужно минимум 2."
        />
      )}

      {mode === "ttc" &&
        (stats.bbt.length >= 2 ? (
          <Card title="Базальная температура">
            <LineChart points={stats.bbt} unit="°C" />
          </Card>
        ) : (
          <EmptyChartCard
            title="Базальная температура"
            hint="Нужно минимум 2 измерения БТ, чтобы построить график."
          />
        ))}

      {(mode === "pregnancy" || mode === "menopause") &&
        (stats.weightWeekly.length >= 2 ? (
          <Card title="Вес по неделям">
            <LineChart points={stats.weightWeekly} unit=" кг" />
          </Card>
        ) : (
          <EmptyChartCard
            title="Вес по неделям"
            hint="Долгосрочный тренд появится, когда замеры веса охватят минимум две разные недели."
          />
        ))}

      {stats.isCycleLike &&
        (stats.cycleLengths.length >= 2 ? (
          <Card title="Длина цикла по циклам">
            <LineChart points={stats.cycleLengths.map((value, index) => ({ ts: index, value }))} unit=" дн" />
          </Card>
        ) : (
          <EmptyChartCard
            title="Длина цикла по циклам"
            hint="Строится по реально отмеченным началам менструаций: нужно 3 и более отмеченных цикла."
          />
        ))}
    </div>
  );
}
