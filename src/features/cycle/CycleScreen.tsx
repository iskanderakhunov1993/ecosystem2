import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { ConfidenceTag } from "@/components/ConfidenceTag";
import { Icon } from "@/data/icons";
import { getQuickLog } from "@/data/modes.config";
import { chipFrequency, detectCycleLengths } from "@/features/analytics/aggregations";
import { AnalyticsScreen } from "@/features/analytics/AnalyticsScreen";
import { DoctorReport } from "@/features/doctor/DoctorReport";
import { PATTERN_THRESHOLD, computePatterns, patternTier } from "@/features/patterns/computePatterns";
import { PredictionsScreen } from "@/features/predictions/PredictionsScreen";
import { derive, formatDate, pluralRu, predictionUncertainty } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import { stageOf } from "@/lib/types";
import type { ConfidenceTier, LogEvent, Mode, Profile, Stage } from "@/lib/types";

type Detail = null | "prediction" | "metrics" | "doctor";

/** Порог, после которого по метрике вообще можно что-то говорить. */
const METRIC_THRESHOLD = 5;

interface MetricRow {
  id: string;
  name: string;
  value: string;
  tier: ConfidenceTier | null;
  note: string | null;
}

/**
 * Строка метрики вместо графика: шесть графиков подряд человек проматывает,
 * шесть строк — читает. Сам график открывается на втором уровне.
 */
function buildMetrics(mode: Mode, stage: Stage | undefined, events: LogEvent[]): MetricRow[] {
  const rows: MetricRow[] = [];
  const lengths = detectCycleLengths(events);

  if (lengths.length > 0) {
    const avg = Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length);
    const spread = predictionUncertainty(lengths);
    rows.push({
      id: "cycle-length",
      name: "Длина цикла",
      value: `${avg} ${pluralRu(avg, "день", "дня", "дней")} · разброс ±${spread}`,
      tier: lengths.length >= 6 ? "HIGH" : lengths.length >= 3 ? "MEDIUM" : "LOW",
      note: null,
    });
  } else {
    rows.push({
      id: "cycle-length",
      name: "Длина цикла",
      value: "Нужно отметить начало месячных дважды",
      tier: null,
      note: "Нет данных",
    });
  }

  const counts = chipFrequency(events);
  for (const chip of getQuickLog(mode, stage)) {
    const count = counts.get(chip.id) ?? 0;
    if (count >= METRIC_THRESHOLD) {
      rows.push({
        id: chip.id,
        name: chip.label,
        value: `${count} ${pluralRu(count, "запись", "записи", "записей")}`,
        tier: count >= 12 ? "HIGH" : "MEDIUM",
        note: null,
      });
    } else {
      rows.push({
        id: chip.id,
        name: chip.label,
        value: count === 0 ? `Нужно ${METRIC_THRESHOLD} записей` : `${count} из ${METRIC_THRESHOLD}`,
        tier: null,
        note: count === 0 ? "Нет данных" : `${count} / ${METRIC_THRESHOLD}`,
      });
    }
  }

  return rows;
}

/** Главная строка прогноза — та же, что человек видит под кольцом на «Сегодня». */
function primaryPrediction(mode: Mode, stage: Stage | undefined, profile: Profile, events: LogEvent[]) {
  const data = derive(mode, stage, profile);
  if (data.kind !== "cycle" && data.kind !== "fertility") return null;

  const lengths = detectCycleLengths(events);
  const uncertainty = predictionUncertainty(lengths);
  const tier: ConfidenceTier = lengths.length >= 6 ? "HIGH" : lengths.length >= 3 ? "MEDIUM" : "LOW";

  return {
    title: "Следующая менструация",
    value:
      uncertainty === 0
        ? formatDate(data.nextPeriodDate)
        : `${formatDate(new Date(data.nextPeriodDate.getTime() - uncertainty * 86_400_000))} – ${formatDate(
            new Date(data.nextPeriodDate.getTime() + uncertainty * 86_400_000)
          )}`,
    detail: `Через ${data.daysToNextPeriod} ${pluralRu(data.daysToNextPeriod, "день", "дня", "дней")}. ${
      lengths.length > 0
        ? `По ${lengths.length} ${pluralRu(lengths.length, "отслеженному циклу", "отслеженным циклам", "отслеженным циклам")}, разброс ±${uncertainty}.`
        : "Пока по данным регистрации — окно сузится, когда появятся реальные циклы."
    }`,
    tier,
  };
}

function DetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="mb-1 flex items-center gap-1.5 text-text-dim">
      <span className="rotate-180">
        <Icon name="chevron" size={16} />
      </span>
      <span className="text-[13px]">{title}</span>
    </button>
  );
}

/**
 * «Мой цикл» — бывшие Аналитика, Паттерны и Прогнозы в одной вкладке.
 * Порядок блоков задан частотой вопросов, а не структурой кода.
 */
export function CycleScreen() {
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile[state.mode]);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const setTab = useAppStore((state) => state.setTab);
  const stage = stageOf(profile);

  const [detail, setDetail] = useState<Detail>(null);

  const prediction = useMemo(
    () => primaryPrediction(mode, stage, profile, events),
    [mode, stage, profile, events],
  );
  const patterns = useMemo(() => computePatterns(events, mode, stage), [events, mode, stage]);
  const metrics = useMemo(() => buildMetrics(mode, stage, events), [mode, stage, events]);
  const tier = patternTier(events.length);

  if (detail === "prediction") {
    return (
      <div className="space-y-4">
        <DetailHeader title="Мой цикл" onBack={() => setDetail(null)} />
        <PredictionsScreen />
      </div>
    );
  }

  if (detail === "metrics") {
    return (
      <div className="space-y-4">
        <DetailHeader title="Мой цикл" onBack={() => setDetail(null)} />
        <AnalyticsScreen />
      </div>
    );
  }

  if (detail === "doctor") {
    return <DoctorReport onBack={() => setDetail(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* 1. Прогноз — самый частый вопрос, поэтому сверху и коротко. */}
      {prediction ? (
        <Card title={prediction.title} action={<ConfidenceTag tier={prediction.tier} />}>
          <p className="font-display text-[22px] font-semibold leading-none text-text">{prediction.value}</p>
          <p className="mt-2.5 text-[13px] leading-snug text-text-dim">{prediction.detail}</p>
          <button
            type="button"
            onClick={() => setDetail("prediction")}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-2 py-2.5 text-[12px] text-text"
          >
            Окно фертильности и ПМС
            <Icon name="chevron" size={14} />
          </button>
        </Card>
      ) : (
        <Card title="Прогноз">
          <p className="text-[13px] leading-snug text-text-dim">
            В этом режиме числовой прогноз не строится. Записи идут в наблюдения ниже.
          </p>
        </Card>
      )}

      {/* 2. Паттерны — то, чего нет у конкурентов в бесплатной версии. */}
      <Card title="Что повторяется">
        {tier === "empty" ? (
          <>
            <p className="text-[13px] leading-snug text-text-faint">
              Пока не с чем сравнивать. Паттерны строятся на твоих записях — нужно {PATTERN_THRESHOLD}{" "}
              {pluralRu(PATTERN_THRESHOLD, "отметка", "отметки", "отметок")}, чтобы появилось первое наблюдение.
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-warn"
                style={{ width: `${Math.min(100, (events.length / PATTERN_THRESHOLD) * 100)}%` }}
              />
            </div>
            <p className="mono-label mt-2 text-text-faint">
              {events.length} из {PATTERN_THRESHOLD}
            </p>
            <button
              type="button"
              onClick={() => setTab("today")}
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-border bg-surface-2 py-2.5 text-[12px] text-text"
            >
              Перейти к записи
            </button>
          </>
        ) : patterns.length === 0 ? (
          <p className="text-[13px] leading-snug text-text-faint">
            Записей уже достаточно, но устойчивых повторов пока не видно. Это нормально — первые
            закономерности обычно появляются после {PATTERN_FULL_HINT} отметок.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {patterns.map((pattern) => (
              <li key={pattern.id} className="border-l-2 border-accent pl-3">
                <p className="text-[13.5px] font-medium leading-snug text-text">{pattern.title}</p>
                <p className="mt-1 text-[12px] leading-snug text-text-dim">{pattern.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 3. Метрики — список, графики на втором уровне. */}
      <Card
        title="Метрики"
        action={
          <button type="button" onClick={() => setDetail("metrics")} className="text-text-faint">
            <Icon name="chevron" size={16} />
          </button>
        }
      >
        <ul>
          {metrics.map((metric, index) => (
            <li
              key={metric.id}
              className={`flex items-center gap-3 py-2.5 ${
                index < metrics.length - 1 ? "border-b border-border-soft" : ""
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] text-text">{metric.name}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-text-dim">{metric.value}</span>
              </span>
              {metric.tier ? (
                <ConfidenceTag tier={metric.tier} />
              ) : (
                <span className="mono-label rounded-md border border-border px-1.5 py-0.5 text-text-faint">
                  {metric.note}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* 4. Для врача. Не вкладка — открывают раз в несколько месяцев.
             Но счётчик виден всегда: иначе никто не узнает, что документ копится. */}
      <button
        type="button"
        onClick={() => setDetail("doctor")}
        className="flex w-full items-center gap-3.5 rounded-card border border-border bg-surface-2 p-4 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
          <Icon name="download" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-text">
            {events.length > 0
              ? `Собрано ${events.length} ${pluralRu(events.length, "запись", "записи", "записей")}`
              : "Для врача"}
          </span>
          <span className="mt-0.5 block text-[12px] leading-snug text-text-dim">
            {events.length >= 40
              ? "Этого уже хватает на разговор с врачом"
              : "Через 3 месяца отметок этого хватит на разговор с врачом"}
          </span>
        </span>
        <span className="text-text-faint">
          <Icon name="chevron" size={18} />
        </span>
      </button>
    </div>
  );
}

const PATTERN_FULL_HINT = 12;
