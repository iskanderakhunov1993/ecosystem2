import { Icon } from "@/data/icons";
import { STAGE_ACCENTS, STAGE_OPTIONS } from "@/data/modes.config";
import type { Stage } from "@/lib/types";

interface StageStepProps {
  mode: "motherhood" | "menopause";
  value: Stage | null;
  onChange: (stage: Stage) => void;
}

export function StageStep({ mode, value, onChange }: StageStepProps) {
  return (
    <div className="pt-2">
      <h1 className="font-display text-[24px] font-semibold leading-tight text-text">Уточни стадию</h1>
      <p className="mt-2 text-[13px] leading-snug text-text-dim">
        Это меняет, что мы показываем и спрашиваем каждый день. Можно изменить позже в профиле.
      </p>

      <div className="mt-5 space-y-2.5">
        {STAGE_OPTIONS[mode].map((option) => {
          const active = value === option.stage;
          const accent = STAGE_ACCENTS[option.stage];
          return (
            <button
              key={option.stage}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.stage)}
              className={`flex w-full items-center gap-3.5 rounded-card border p-4 text-left transition active:scale-[0.99] ${
                active ? "border-current" : "border-border bg-surface"
              }`}
              style={active ? { borderColor: accent.accent, background: accent.accentSoft } : undefined}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: accent.accentSoft, color: accent.accentText }}
              >
                <Icon name="spark" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-text">{option.title}</span>
                <span className="mt-0.5 block text-[12px] text-text-dim">{option.hint}</span>
              </span>
              {active && (
                <span style={{ color: accent.accentText }}>
                  <Icon name="check" size={18} strokeWidth={2} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
