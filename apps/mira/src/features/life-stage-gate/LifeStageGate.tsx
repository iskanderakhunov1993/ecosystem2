import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import {
  ProfileFields,
  draftToProfile,
  initialDraft,
  isDraftComplete,
  type FieldDraft,
} from "@/components/ProfileFields";
import { Icon } from "@/data/icons";
import { GATE_INTRO_TEXT, LIFE_STAGES, MODE_ACCENTS, SOFT_PROMPT_TEXT } from "@/data/modes.config";
import { useAppStore } from "@/store/appStore";
import type { Mode } from "@/lib/types";

/**
 * Режим переключается только через подтверждение жизненного события,
 * а не свободным выбором из списка.
 */
export function LifeStageGate({ onClose }: { onClose: () => void }) {
  const mode = useAppStore((state) => state.mode);
  const profiles = useAppStore((state) => state.profile);
  const switchMode = useAppStore((state) => state.switchMode);

  const [target, setTarget] = useState<Mode | null>(null);
  const [draft, setDraft] = useState<FieldDraft>({});

  const stage = target ? LIFE_STAGES.find((item) => item.mode === target) : null;
  const soft = stage?.soft === true;

  const select = (next: Mode) => {
    setTarget(next);
    setDraft(initialDraft(next, profiles[next] ?? {}));
  };

  const confirm = () => {
    if (!target) return;
    switchMode(target, draftToProfile(target, draft));
  };

  if (!target || !stage) {
    return (
      <BottomSheet open title="Что изменилось?" subtitle={GATE_INTRO_TEXT} onClose={onClose}>
        <ul className="space-y-2.5">
          {LIFE_STAGES.map((item) => {
            const current = item.mode === mode;
            const accent = MODE_ACCENTS[item.mode];
            return (
              <li key={item.mode}>
                <button
                  type="button"
                  disabled={current}
                  onClick={() => select(item.mode)}
                  className={`flex w-full items-center gap-3.5 rounded-card border p-4 text-left transition ${
                    current ? "border-border bg-surface-2" : "border-border bg-surface active:scale-[0.99]"
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: accent.accentSoft, color: accent.accentText }}
                  >
                    <Icon name="spark" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-text">{item.title}</span>
                    <span className="mt-0.5 block text-[12px] text-text-dim">{item.hint}</span>
                  </span>
                  {current ? (
                    <span className="mono-label shrink-0 rounded-md border border-border px-1.5 py-0.5 text-text-dim">
                      ТЕКУЩИЙ
                    </span>
                  ) : (
                    <span className="shrink-0 text-text-faint">
                      <Icon name="chevron" size={16} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open
      title={stage.title}
      subtitle={soft ? undefined : "Подтверди событие и уточни пару цифр"}
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <Button disabled={!isDraftComplete(target, draft)} onClick={confirm}>
            {soft ? "Похоже, да — переключить" : "Переключить режим"}
          </Button>
          <Button variant="ghost" onClick={() => setTarget(null)}>
            {soft ? "Не сейчас" : "Отмена"}
          </Button>
        </div>
      }
    >
      {soft && (
        <p className="mb-5 rounded-card border border-border bg-surface-2 p-4 text-[13px] leading-snug text-text-dim">
          {SOFT_PROMPT_TEXT}
        </p>
      )}
      <ProfileFields mode={target} draft={draft} onChange={setDraft} />
    </BottomSheet>
  );
}
