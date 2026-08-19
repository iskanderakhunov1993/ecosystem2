import { Icon } from "@/data/icons";
import { LIFE_STAGES, MODE_ACCENTS } from "@/data/modes.config";
import type { Mode } from "@/lib/types";

interface GoalStepProps {
  value: Mode | null;
  onChange: (mode: Mode) => void;
}

export function GoalStep({ value, onChange }: GoalStepProps) {
  return (
    <div className="pt-2">
      <h1 className="font-display text-[24px] font-semibold leading-tight text-text">
        Что привело тебя в Livi?
      </h1>
      <p className="mt-2 text-[13px] leading-snug text-text-dim">
        От этого зависит стартовый режим — потом его можно поменять по жизненному событию.
      </p>

      <div className="mt-5 space-y-2.5">
        {LIFE_STAGES.map((stage) => {
          const active = value === stage.mode;
          const accent = MODE_ACCENTS[stage.mode];
          return (
            <button
              key={stage.mode}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(stage.mode)}
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
                <span className="block text-[15px] font-medium text-text">{stage.title}</span>
                <span className="mt-0.5 block text-[12px] text-text-dim">{stage.hint}</span>
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
