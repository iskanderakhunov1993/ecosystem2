import { OptionChips, Stepper, FieldLabel } from "@/components/inputs";
import { ONBOARD_CONFIG, type OnboardField } from "@/data/modes.config";
import type { Mode, Profile, ProfileValue } from "@/lib/types";

/** Значение поля в UI: подпись выбранного чипа или число степпера. */
export type FieldDraft = Record<string, string | number | undefined>;

export function initialDraft(mode: Mode, profile: Profile): FieldDraft {
  const draft: FieldDraft = {};
  for (const field of ONBOARD_CONFIG[mode].fields) {
    const saved = profile[field.key];
    if (field.kind === "stepper") {
      draft[field.key] = typeof saved === "number" ? saved : field.default;
    } else if (field.valueMap) {
      const index = typeof saved === "number" ? field.valueMap.indexOf(saved) : -1;
      draft[field.key] = index >= 0 ? field.options[index] : undefined;
    } else {
      draft[field.key] = typeof saved === "string" ? saved : undefined;
    }
  }
  return draft;
}

export function isDraftComplete(mode: Mode, draft: FieldDraft): boolean {
  return ONBOARD_CONFIG[mode].fields.every((field) => draft[field.key] !== undefined);
}

export function draftToProfile(mode: Mode, draft: FieldDraft): Profile {
  const profile: Profile = {};
  for (const field of ONBOARD_CONFIG[mode].fields) {
    const value = draft[field.key];
    if (value === undefined) continue;
    if (field.kind === "stepper") {
      profile[field.key] = Number(value);
    } else if (field.valueMap) {
      const index = field.options.indexOf(String(value));
      profile[field.key] = (index >= 0 ? field.valueMap[index] : 0) as ProfileValue;
      // качественная метка сохраняется рядом — для History и подсказок
      profile[`${field.key}Label`] = String(value);
    } else {
      profile[field.key] = String(value);
    }
  }
  return profile;
}

interface ProfileFieldsProps {
  mode: Mode;
  draft: FieldDraft;
  onChange: (next: FieldDraft) => void;
  fields?: OnboardField[];
}

/** Один рендерер полей на онбординг, life-stage gate и settings. */
export function ProfileFields({ mode, draft, onChange, fields }: ProfileFieldsProps) {
  const list = fields ?? ONBOARD_CONFIG[mode].fields;

  return (
    <div className="space-y-5">
      {list.map((field) => (
        <div key={field.key}>
          <FieldLabel>{field.label}</FieldLabel>
          {field.kind === "chips" ? (
            <OptionChips
              options={field.options}
              value={draft[field.key] === undefined ? [] : [String(draft[field.key])]}
              onChange={(next) => onChange({ ...draft, [field.key]: next[0] })}
            />
          ) : (
            <Stepper
              value={typeof draft[field.key] === "number" ? (draft[field.key] as number) : field.default}
              min={field.min}
              max={field.max}
              step={field.step}
              unit={field.unit}
              onChange={(next) => onChange({ ...draft, [field.key]: next })}
            />
          )}
        </div>
      ))}
    </div>
  );
}
