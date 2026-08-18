import { Icon } from "@/data/icons";
import { MOOD_SCALE, MOOD_SCALE_LABELS } from "@/data/modes.config";

export function FieldLabel({ children }: { children: string }) {
  return <p className="mono-label mb-2.5 text-text-dim">{children}</p>;
}

interface OptionChipsProps {
  options: string[];
  value: string[];
  multi?: boolean;
  onChange: (next: string[]) => void;
}

export function OptionChips({ options, value, multi = false, onChange }: OptionChipsProps) {
  const toggle = (option: string) => {
    if (multi) {
      onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
    } else {
      onChange(value[0] === option ? [] : [option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option)}
            className={`rounded-chip border px-3.5 py-2.5 text-[13px] transition active:scale-[0.97] ${
              active
                ? "border-accent bg-accent-soft text-accent-text"
                : "border-border bg-surface-2 text-text-dim"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (next: number) => void;
}

export function Stepper({ value, min, max, step = 1, unit, onChange }: StepperProps) {
  const decimals = step < 1 ? String(step).split(".")[1]?.length ?? 1 : 0;
  const clamp = (next: number) => Number(Math.min(max, Math.max(min, next)).toFixed(decimals));

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2 px-3 py-3">
      <button
        type="button"
        aria-label="Уменьшить"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="rounded-xl bg-surface-3 p-2.5 text-text disabled:text-text-faint"
      >
        <Icon name="minus" size={16} />
      </button>
      <div className="text-center">
        <span className="font-display text-[28px] font-semibold leading-none text-text">
          {value.toFixed(decimals)}
        </span>
        <span className="mono-label ml-2 text-text-dim">{unit}</span>
      </div>
      <button
        type="button"
        aria-label="Увеличить"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="rounded-xl bg-surface-3 p-2.5 text-text disabled:text-text-faint"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

interface Scale5Props {
  value: number | null;
  onChange: (next: number) => void;
}

export function Scale5({ value, onChange }: Scale5Props) {
  return (
    <div className="flex gap-2">
      {MOOD_SCALE.map((emoji, index) => {
        const scaleValue = index + 1;
        const active = value === scaleValue;
        return (
          <button
            key={scaleValue}
            type="button"
            aria-label={MOOD_SCALE_LABELS[index]}
            aria-pressed={active}
            onClick={() => onChange(scaleValue)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-chip border py-3 transition active:scale-[0.97] ${
              active ? "border-accent bg-accent-soft" : "border-border bg-surface-2"
            }`}
          >
            <span className="text-[22px] leading-none">{emoji}</span>
            <span className={`text-[10px] ${active ? "text-accent-text" : "text-text-faint"}`}>
              {MOOD_SCALE_LABELS[index]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
