import { useState } from "react";
import { Button } from "@/components/Button";
import { FieldLabel } from "@/components/inputs";
import { Icon } from "@/data/icons";
import {
  LOCATIONS,
  SAFE_POOLS,
  SAFE_POOL_DISCLAIMER,
  WORKOUT_POOLS,
  type ExerciseTemplate,
  type LocationId,
} from "@/data/modes.config";
import { useAppStore } from "@/store/appStore";
import { stageOf } from "@/lib/types";
import { getReadiness, intensityFor, isSafeStage } from "./readiness";
import { MeditationTab } from "./MeditationTab";

const LEVEL_LABEL: Record<"low" | "medium" | "high", string> = {
  low: "Щадящая",
  medium: "Умеренная",
  high: "Интенсивная",
};

interface ExerciseState extends ExerciseTemplate {
  status: "pending" | "done" | "skipped";
  note: string;
}

/**
 * «Тренировка» — своя частота (открывают заодно с ежедневной отметкой, но
 * это не производная от «Сегодня»: план строится по готовности, но выбор
 * места и завершение сессии — отдельное действие) и свой вопрос: «что мне
 * сегодня физически можно и стоит сделать».
 */
export function WorkoutScreen() {
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile[state.mode]);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const addSession = useAppStore((state) => state.addSession);
  const stage = stageOf(profile);

  const [tab, setTab] = useState<"workout" | "meditation">("workout");
  const [location, setLocation] = useState<LocationId | null>(null);
  const [plan, setPlan] = useState<ExerciseState[] | null>(null);

  const safe = isSafeStage(stage);
  const readiness = getReadiness(events);

  const generate = () => {
    if (!location) return;
    const pool = safe ? SAFE_POOLS[stage][location] : WORKOUT_POOLS[intensityFor(readiness.level)][location];
    setPlan(pool.map((item) => ({ ...item, status: "pending", note: "" })));
  };

  const finish = () => {
    if (!plan || !location) return;
    const done = plan.filter((item) => item.status === "done").length;
    const locationLabel = LOCATIONS.find((item) => item.id === location)?.label ?? "";
    addSession({
      mode,
      kind: "workout",
      summary: `Тренировка: ${done} из ${plan.length} упражнений`,
      detail: `${locationLabel} · ${safe ? "щадящая программа" : LEVEL_LABEL[readiness.level].toLowerCase()}`,
    });
    setPlan(null);
    setLocation(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface-2 p-1">
        {(["workout", "meditation"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-xl px-3 py-2.5 text-[13px] transition ${
              tab === value ? "bg-accent-soft text-accent-text" : "text-text-dim"
            }`}
          >
            {value === "workout" ? "Тренировка" : "Медитация"}
          </button>
        ))}
      </div>

      {tab === "meditation" ? (
        <MeditationTab mode={mode} stage={stage} onDone={() => undefined} />
      ) : (
        <div className="space-y-6">
          <div
            className={`rounded-card border p-4 ${
              safe ? "border-accent/40 bg-accent-soft" : "border-border bg-surface"
            }`}
          >
            <p className="mono-label text-text-dim">
              {safe ? "ЩАДЯЩАЯ ПРОГРАММА" : `ГОТОВНОСТЬ · ${LEVEL_LABEL[readiness.level].toUpperCase()}`}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-text-dim">
              {safe ? SAFE_POOL_DISCLAIMER : readiness.reasonText}
            </p>
          </div>

          {!plan && (
            <>
              <div>
                <FieldLabel>Где тренируешься?</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATIONS.map((item) => {
                    const active = location === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setLocation(item.id)}
                        className={`flex items-center gap-2.5 rounded-chip border px-3.5 py-3 text-[13px] transition ${
                          active
                            ? "border-accent bg-accent-soft text-accent-text"
                            : "border-border bg-surface-2 text-text-dim"
                        }`}
                      >
                        <Icon name={item.icon} size={18} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button disabled={!location} onClick={generate}>
                Сгенерировать
              </Button>
            </>
          )}

          {plan && (
            <>
              <ul className="space-y-2.5">
                {plan.map((item, index) => (
                  <li key={item.name} className="rounded-card border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-text">{item.name}</p>
                        <p className="mt-1 text-[12px] text-text-dim">{item.detail}</p>
                      </div>
                      {item.status !== "pending" && (
                        <span
                          className={`mono-label shrink-0 ${
                            item.status === "done" ? "text-ok" : "text-text-faint"
                          }`}
                        >
                          {item.status === "done" ? "ВЫПОЛНЕНО" : "ПРОПУЩЕНО"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {(["done", "skipped"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            setPlan((prev) =>
                              prev!.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, status: entry.status === status ? "pending" : status }
                                  : entry,
                              ),
                            )
                          }
                          className={`flex-1 rounded-chip border px-3 py-2 text-[12px] transition ${
                            item.status === status
                              ? "border-accent bg-accent-soft text-accent-text"
                              : "border-border bg-surface-2 text-text-dim"
                          }`}
                        >
                          {status === "done" ? "Выполнено" : "Пропустить"}
                        </button>
                      ))}
                    </div>

                    <input
                      value={item.note}
                      onChange={(event) =>
                        setPlan((prev) =>
                          prev!.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, note: event.target.value } : entry,
                          ),
                        )
                      }
                      placeholder="Заметка к упражнению"
                      className="mt-2.5 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
                    />
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <Button onClick={finish}>Завершить тренировку</Button>
                <Button variant="ghost" onClick={() => setPlan(null)}>
                  Выбрать другую локацию
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
