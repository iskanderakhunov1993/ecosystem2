import { useMemo } from "react";
import { Card } from "@/components/Card";
import { ConfidenceTag } from "@/components/ConfidenceTag";
import { derive, formatDate, pluralRu } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import type { Mode, Profile } from "@/lib/types";
import { computeConfidence } from "./computeConfidence";

interface PredictionCard {
  id: string;
  title: string;
  value: string;
  detail: string;
  /** Карточка без числового прогноза — метка уверенности к ней неприменима. */
  noPrediction?: boolean;
}

/**
 * Сами значения считаются из профиля — они реальны с первого дня.
 * Честной здесь является метка уверенности, а не факт наличия числа.
 */
function buildCards(mode: Mode, profile: Profile): PredictionCard[] {
  const data = derive(mode, profile);

  switch (data.kind) {
    case "cycle": {
      const cards: PredictionCard[] = [
        {
          id: "next-period",
          title: "Следующая менструация",
          value: formatDate(data.nextPeriodDate),
          detail: `Через ${data.daysToNextPeriod} ${pluralRu(data.daysToNextPeriod, "день", "дня", "дней")} при цикле ${data.cycleLen} дней.`,
        },
        {
          id: "fertile",
          title: "Окно фертильности",
          value: `Дни ${data.fertileFrom}–${data.fertileTo}`,
          detail: `Овуляция ориентировочно на ${data.ovulationDay}-й день цикла.`,
        },
      ];
      if (mode === "cycle") {
        cards.push({
          id: "pms",
          title: "Возможный ПМС",
          value: `Дни ${Math.max(1, data.cycleLen - 5)}–${data.cycleLen}`,
          detail: "Оценка по длине цикла — не диагноз и не медицинское заключение.",
        });
      }
      return cards;
    }
    case "pregnancy":
      return [
        {
          id: "due",
          title: "Ориентировочная дата родов",
          value: formatDate(data.dueDate),
          detail: `Расчёт от указанного срока — ${data.week} недель. Точную дату определяет врач.`,
        },
        {
          id: "trimester",
          title: "Текущий триместр",
          value: `${data.trimester} триместр`,
          detail: `До родов примерно ${data.weeksToBirth} ${pluralRu(data.weeksToBirth, "неделя", "недели", "недель")}.`,
        },
      ];
    case "postpartum":
      return [
        {
          id: "checkup",
          title: "Плановый осмотр",
          value:
            data.daysToCheckup > 0
              ? `Через ${data.daysToCheckup} ${pluralRu(data.daysToCheckup, "день", "дня", "дней")}`
              : "Срок наступил",
          detail: "Стандартный ориентир — около 6 недель после родов.",
        },
        {
          id: "recovery",
          title: "Этап восстановления",
          value: `Неделя ${data.week}`,
          detail: "Нагрузку стоит наращивать постепенно и обсудить с квалифицированным клиницистом.",
        },
      ];
    case "menopause":
      return [
        {
          id: "since",
          title: "Без менструации",
          value: `${data.monthsSince} мес`,
          detail: "Прогнозы цикла в этом режиме не строятся — трекинг идёт по симптомам.",
          noPrediction: true,
        },
      ];
    case "perimenopause":
      return [
        {
          id: "no-cycle-prediction",
          title: "Дата следующей менструации",
          value: "Не прогнозируем",
          detail: `Цикл нерегулярен${data.irregularForLabel ? ` (${data.irregularForLabel})` : ""} — числовой прогноз давал бы ложную точность.`,
          noPrediction: true,
        },
        {
          id: "focus",
          title: "На что смотреть",
          value: "Приливы и сон",
          detail: "Эти записи дают больше сигнала, чем расчётный день цикла.",
          noPrediction: true,
        },
      ];
    default:
      return [];
  }
}

export function PredictionsScreen() {
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile[state.mode]);
  const events = useAppStore((state) => state.logEvents[state.mode]);

  const confidence = useMemo(() => computeConfidence(events.length), [events.length]);
  const cards = useMemo(() => buildCards(mode, profile), [mode, profile]);
  const onlyQualitative = cards.length > 0 && cards.every((card) => card.noPrediction);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-card border border-border bg-surface p-4">
        {!onlyQualitative && <ConfidenceTag tier={confidence.tier} />}
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-text-dim">
          {onlyQualitative
            ? "Числовые прогнозы в этом режиме не строятся — записи идут в наблюдения на вкладке «Паттерны»."
            : confidence.note}
        </p>
      </div>

      {cards.map((card) => (
        <Card
          key={card.id}
          title={card.title}
          action={card.noPrediction ? undefined : <ConfidenceTag tier={confidence.tier} />}
        >
          <p className="font-display text-[22px] font-semibold leading-none text-text">{card.value}</p>
          <p className="mt-2.5 text-[13px] leading-snug text-text-dim">{card.detail}</p>
        </Card>
      ))}
    </div>
  );
}
