import { Icon } from "@/data/icons";
import { MODE_LABELS } from "@/data/modes.config";
import type { Mode } from "@/lib/types";

interface DoneStepProps {
  mode: Mode;
  summary: string[];
}

export function DoneStep({ mode, summary }: DoneStepProps) {
  return (
    <div className="pt-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
        <Icon name="check" size={26} strokeWidth={2} />
      </div>
      <h1 className="mt-5 font-display text-[24px] font-semibold leading-tight text-text">
        Готово — режим «{MODE_LABELS[mode]}»
      </h1>
      <p className="mt-2 text-[13px] leading-snug text-text-dim">
        Дашборд уже считает по твоим данным. Чем больше записей — тем честнее паттерны и прогнозы.
      </p>

      <ul className="mt-5 space-y-2">
        {summary.map((line) => (
          <li
            key={line}
            className="rounded-card border border-border bg-surface px-4 py-3 text-[13px] text-text-dim"
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
