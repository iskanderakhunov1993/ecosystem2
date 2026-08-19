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
import {
  CORE_MODES,
  GATE_INTRO_TEXT,
  MODE_ACCENTS,
  PREGNANCY_EXIT_TEXT,
  PREGNANCY_EXIT_TITLE,
  STAGE_ACCENTS,
  STAGE_OPTIONS,
  SOFT_PROMPT_TEXT,
} from "@/data/modes.config";
import { useAppStore } from "@/store/appStore";
import { stageOf, type Mode, type Stage } from "@/lib/types";

const hasStages = (mode: Mode): mode is "motherhood" | "menopause" =>
  mode === "motherhood" || mode === "menopause";

/**
 * Режим переключается только через подтверждение жизненного события, не
 * свободным выбором. У motherhood/menopause есть второй шаг — стадия,
 * тем же bottom sheet, без отдельной модалки.
 */
export function LifeStageGate({ onClose }: { onClose: () => void }) {
  const mode = useAppStore((state) => state.mode);
  const profiles = useAppStore((state) => state.profile);
  const switchMode = useAppStore((state) => state.switchMode);
  const setStage = useAppStore((state) => state.setStage);
  const currentStage = stageOf(profiles[mode]);

  const [target, setTarget] = useState<Mode | null>(null);
  const [targetStage, setTargetStage] = useState<Stage | null>(null);
  const [draft, setDraft] = useState<FieldDraft>({});
  const [pregnancyExitAck, setPregnancyExitAck] = useState(false);

  const leavingPregnancy = mode === "motherhood";

  const selectMode = (next: Mode) => {
    if (leavingPregnancy && next === "cycle") {
      // Отдельный экран-подтверждение — см. рендер ниже, до обычного confirm-шага.
      setTarget(next);
      return;
    }
    if (hasStages(next)) {
      setTarget(next);
      setTargetStage(null);
      return;
    }
    setTarget(next);
    setDraft(initialDraft(next, undefined, profiles[next] ?? {}));
  };

  const confirmPregnancyExit = () => {
    setPregnancyExitAck(true);
    setDraft(initialDraft("cycle", undefined, profiles.cycle ?? {}));
  };

  const backToModeList = () => {
    setTarget(null);
    setPregnancyExitAck(false);
  };

  const selectStage = (stage: Stage) => {
    setTargetStage(stage);
    const base = target === mode ? profiles[mode] : (profiles[target as Mode] ?? {});
    setDraft(initialDraft(target as Mode, stage, base));
  };

  const stageOption =
    target && hasStages(target) && targetStage
      ? STAGE_OPTIONS[target].find((item) => item.stage === targetStage)
      : null;
  const soft = stageOption?.soft === true;

  const confirm = () => {
    if (!target) return;
    const profile = draftToProfile(target, targetStage ?? undefined, draft);
    if (target === mode) {
      // Тот же mode — меняется только стадия.
      if (targetStage) setStage(targetStage);
    } else {
      switchMode(target, profile);
    }
    onClose();
  };

  // Шаг 1: выбор из 4 core mode.
  if (!target) {
    return (
      <BottomSheet open title="Что изменилось?" subtitle={GATE_INTRO_TEXT} onClose={onClose}>
        <ul className="space-y-2.5">
          {CORE_MODES.map((item) => {
            const current = item.mode === mode && !hasStages(item.mode);
            const accent = MODE_ACCENTS[item.mode];
            return (
              <li key={item.mode}>
                <button
                  type="button"
                  disabled={current}
                  onClick={() => selectMode(item.mode)}
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
                  {item.mode === mode ? (
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

  // Отдельный экран, если уходим из беременности/после родов в «Отслеживать цикл» —
  // без слова «завершить», без поздравлений, до обычного confirm-шага.
  if (leavingPregnancy && target === "cycle" && !pregnancyExitAck) {
    return (
      <BottomSheet
        open
        title={PREGNANCY_EXIT_TITLE}
        onClose={onClose}
        footer={
          <div className="space-y-2">
            <Button onClick={confirmPregnancyExit}>Продолжить</Button>
            <Button variant="ghost" onClick={backToModeList}>
              Назад
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-snug text-text-dim">{PREGNANCY_EXIT_TEXT}</p>
      </BottomSheet>
    );
  }

  // Шаг 2 (только motherhood/menopause): выбор стадии внутри режима.
  if (hasStages(target) && !targetStage) {
    return (
      <BottomSheet
        open
        title="Уточни стадию"
        onClose={onClose}
        footer={
          <Button variant="ghost" onClick={backToModeList}>
            Назад
          </Button>
        }
      >
        <ul className="space-y-2.5">
          {STAGE_OPTIONS[target].map((item) => {
            const current = target === mode && item.stage === currentStage;
            const accent = STAGE_ACCENTS[item.stage];
            return (
              <li key={item.stage}>
                <button
                  type="button"
                  disabled={current}
                  onClick={() => selectStage(item.stage)}
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

  // Шаг 3 (или 2 для cycle/fertility): подтверждение с полями профиля.
  const title = stageOption?.title ?? CORE_MODES.find((item) => item.mode === target)?.title ?? "";

  return (
    <BottomSheet
      open
      title={title}
      subtitle={soft ? undefined : "Подтверди событие и уточни пару цифр"}
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <Button disabled={!isDraftComplete(target, targetStage ?? undefined, draft)} onClick={confirm}>
            {soft ? "Похоже, да — переключить" : "Переключить режим"}
          </Button>
          <Button variant="ghost" onClick={() => (hasStages(target) ? setTargetStage(null) : backToModeList())}>
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
      <ProfileFields mode={target} stage={targetStage ?? undefined} draft={draft} onChange={setDraft} />
    </BottomSheet>
  );
}
