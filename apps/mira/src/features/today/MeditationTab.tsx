import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Ring } from "@/components/Ring";
import { FieldLabel, OptionChips } from "@/components/inputs";
import { Icon } from "@/data/icons";
import { MEDITATION_DURATIONS, MEDITATION_PROMPTS, MEDITATION_SOUNDS } from "@/data/modes.config";
import { useAppStore } from "@/store/appStore";
import type { Mode } from "@/lib/types";

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MeditationTab({ mode, onDone }: { mode: Mode; onDone: () => void }) {
  const addSession = useAppStore((state) => state.addSession);

  const [minutes, setMinutes] = useState(MEDITATION_DURATIONS[0]);
  const [sound, setSound] = useState(MEDITATION_SOUNDS[0]);
  const [remaining, setRemaining] = useState(MEDITATION_DURATIONS[0] * 60);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(minutes * 60);
    setRunning(false);
  }, [minutes]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running]);

  const total = minutes * 60;
  const elapsed = total - remaining;

  const save = () => {
    const done = Math.round(elapsed / 60);
    addSession({
      mode,
      kind: "meditation",
      summary: `Медитация ${done > 0 ? done : minutes} мин`,
      detail: `${sound} · запланировано ${minutes} мин`,
    });
    onDone();
  };

  return (
    <div className="space-y-6">
      <p className="rounded-card border border-border bg-surface p-4 text-[13px] leading-snug text-text-dim">
        {MEDITATION_PROMPTS[mode]}
      </p>

      <div>
        <FieldLabel>Длительность</FieldLabel>
        <OptionChips
          options={MEDITATION_DURATIONS.map((value) => `${value} мин`)}
          value={[`${minutes} мин`]}
          onChange={(next) => {
            if (next[0]) setMinutes(Number.parseInt(next[0], 10));
          }}
        />
      </div>

      <div>
        <FieldLabel>Звук</FieldLabel>
        <OptionChips
          options={MEDITATION_SOUNDS}
          value={[sound]}
          onChange={(next) => {
            if (next[0]) setSound(next[0]);
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-5 pt-1">
        <Ring
          value={elapsed}
          max={total}
          size={184}
          label={mmss(remaining)}
          sublabel={running ? "идёт практика" : remaining === 0 ? "завершено" : "пауза"}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={running ? "Пауза" : "Старт"}
            onClick={() => setRunning((value) => !value)}
            disabled={remaining === 0}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-[#12141A] disabled:bg-surface-3 disabled:text-text-faint"
          >
            <Icon name={running ? "pause" : "play"} size={22} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Сначала"
            onClick={() => {
              setRunning(false);
              setRemaining(total);
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-2 text-text-dim"
          >
            <Icon name="restart" size={20} />
          </button>
        </div>
      </div>

      <Button disabled={elapsed === 0} onClick={save}>
        Сохранить сессию
      </Button>
    </div>
  );
}
