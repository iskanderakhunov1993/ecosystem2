import { useMemo } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Icon } from "@/data/icons";
import { QUICK_LOG } from "@/data/modes.config";
import { formatDayHeading, pluralRu } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import { PATTERN_THRESHOLD, computePatterns, patternTier, primaryPattern } from "./computePatterns";

export function PatternsScreen() {
  const mode = useAppStore((state) => state.mode);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const setTab = useAppStore((state) => state.setTab);

  const tier = patternTier(events.length);
  const patterns = useMemo(() => computePatterns(events, mode), [events, mode]);
  const insight = useMemo(() => primaryPattern(events, mode), [events, mode]);

  const recent = [...events].reverse().slice(0, 6);

  if (tier === "empty") {
    return (
      <Card title="Паттерны">
        <div className="py-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
            <Icon name="patterns" size={22} />
          </span>
          <p className="mx-auto mt-4 max-w-[300px] text-[14px] leading-snug text-text-dim">
            Пока не с чем сравнивать. Паттерны строятся на твоих собственных записях — начни
            логировать на Today.
          </p>
          <div className="mx-auto mt-5 max-w-[260px]">
            <Button onClick={() => setTab("today")}>Перейти к записи</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tier !== "full" && (
        <Card title="Прогресс к паттернам">
          <p className="text-[13px] leading-snug text-text-dim">
            {tier === "low"
              ? `Собрано ${events.length} ${pluralRu(events.length, "запись", "записи", "записей")} из ${PATTERN_THRESHOLD} — пока это просто список того, что ты отметила, без статистических выводов.`
              : `Записей достаточно для первых наблюдений. С 12 записей появятся более устойчивые паттерны.`}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${Math.min(100, (events.length / (tier === "low" ? PATTERN_THRESHOLD : 12)) * 100)}%`,
              }}
            />
          </div>
        </Card>
      )}

      {tier === "medium" && insight && (
        <Card title="Первое наблюдение">
          <p className="text-[15px] font-medium leading-snug text-text">{insight.title}</p>
          <p className="mt-1.5 text-[13px] leading-snug text-text-dim">{insight.detail}</p>
        </Card>
      )}

      {tier === "full" && (
        <Card title="Найденные паттерны">
          {patterns.length === 0 ? (
            <p className="text-[13px] leading-snug text-text-faint">
              Записей достаточно, но повторов пока не видно — устойчивых паттернов нет.
            </p>
          ) : (
            <ul className="space-y-4">
              {patterns.map((pattern) => (
                <li key={pattern.id}>
                  <p className="text-[15px] font-medium leading-snug text-text">{pattern.title}</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-text-dim">{pattern.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card title="Что уже залогировано">
        <ul className="space-y-2.5">
          {recent.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-text">
                  {QUICK_LOG[mode].find((chip) => chip.id === event.chipId)?.label ?? event.chipId}
                </span>
                <span className="block text-[12px] leading-snug text-text-dim">{event.summary}</span>
              </span>
              <span className="mono-label shrink-0 text-text-faint">
                {formatDayHeading(event.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
