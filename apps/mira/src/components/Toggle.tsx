interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-text">{label}</span>
        {description && (
          <span className="mt-1 block text-[12px] leading-snug text-text-dim">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-[30px] w-[50px] shrink-0 rounded-full border transition ${
          checked ? "border-accent bg-accent-soft" : "border-border bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-[3px] h-[22px] w-[22px] rounded-full transition-all ${
            checked ? "left-[25px] bg-accent" : "left-[3px] bg-text-faint"
          }`}
        />
      </button>
    </label>
  );
}
