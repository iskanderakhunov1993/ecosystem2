import { OptionChips, FieldLabel } from "@/components/inputs";
import type { LogGroup } from "@/data/modes.config";

interface BaselineStepProps {
  group: LogGroup;
  value: string[];
  onChange: (next: string[]) => void;
}

export function BaselineStep({ group, value, onChange }: BaselineStepProps) {
  return (
    <div className="pt-2">
      <h1 className="font-display text-[24px] font-semibold leading-tight text-text">
        Что беспокоит сейчас?
      </h1>
      <p className="mt-2 text-[13px] leading-snug text-text-dim">
        Шаг необязательный. Отмеченное сразу станет твоей первой записью в логе.
      </p>
      <div className="mt-5">
        <FieldLabel>{group.label}</FieldLabel>
        <OptionChips options={group.options ?? []} value={value} multi onChange={onChange} />
      </div>
    </div>
  );
}
