import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import {
  ProfileFields,
  draftToProfile,
  initialDraft,
  isDraftComplete,
  type FieldDraft,
} from "@/components/ProfileFields";
import { Icon } from "@/data/icons";
import { getOnboardConfig, getQuickLog, MODE_LABELS } from "@/data/modes.config";
import { useAppStore, applyAccent } from "@/store/appStore";
import type { Mode, Stage } from "@/lib/types";
import { WelcomeStep } from "./steps/WelcomeStep";
import { PrivacyStep } from "./steps/PrivacyStep";
import { GoalStep } from "./steps/GoalStep";
import { StageStep } from "./steps/StageStep";
import { BaselineStep } from "./steps/BaselineStep";
import { DoneStep } from "./steps/DoneStep";

type StepId = "welcome" | "privacy" | "goal" | "stage" | "fields" | "baseline" | "done";

const hasStages = (mode: Mode): mode is "motherhood" | "menopause" =>
  mode === "motherhood" || mode === "menopause";

function baselineGroup(mode: Mode | null, stage: Stage | null) {
  if (!mode) return null;
  if (hasStages(mode) && !stage) return null;
  const chipId = getOnboardConfig(mode, stage ?? undefined).baselineChipId;
  if (!chipId) return null;
  const chip = getQuickLog(mode, stage ?? undefined).find((item) => item.id === chipId);
  const group = chip?.groups.find((item) => item.type === "multi");
  return chip && group ? { chipId: chip.id, group } : null;
}

export function OnboardingWizard() {
  const privacy = useAppStore((state) => state.privacy);
  const setConsent = useAppStore((state) => state.setConsent);
  const setAnonymousMode = useAppStore((state) => state.setAnonymousMode);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const addLogEvent = useAppStore((state) => state.addLogEvent);

  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [draft, setDraft] = useState<FieldDraft>({});
  const [baseline, setBaseline] = useState<string[]>([]);

  const baselineInfo = baselineGroup(mode, stage);

  const steps = useMemo<StepId[]>(() => {
    const list: StepId[] = ["welcome", "privacy", "goal"];
    if (mode && hasStages(mode)) list.push("stage");
    list.push("fields");
    if (baselineInfo) list.push("baseline");
    list.push("done");
    return list;
  }, [mode, baselineInfo]);

  const step = steps[Math.min(index, steps.length - 1)];

  const canAdvance = (() => {
    switch (step) {
      case "privacy":
        return privacy.consented;
      case "goal":
        return mode !== null;
      case "stage":
        return stage !== null;
      case "fields":
        return mode !== null && isDraftComplete(mode, stage ?? undefined, draft);
      default:
        return true;
    }
  })();

  const chooseMode = (next: Mode) => {
    setMode(next);
    setStage(null);
    setBaseline([]);
    if (!hasStages(next)) {
      setDraft(initialDraft(next, undefined, {}));
      applyAccent(next);
    }
  };

  const chooseStage = (next: Stage) => {
    setStage(next);
    if (mode) {
      setDraft(initialDraft(mode, next, {}));
      applyAccent(mode, next);
    }
  };

  const finish = () => {
    if (!mode) return;
    completeOnboarding(mode, draftToProfile(mode, stage ?? undefined, draft));
    if (baselineInfo && baseline.length > 0) {
      addLogEvent({
        mode,
        chipId: baselineInfo.chipId,
        summary: baseline.join(", "),
        multiLabels: baseline,
      });
    }
  };

  const summaryLines = mode && !(hasStages(mode) && !stage)
    ? getOnboardConfig(mode, stage ?? undefined).fields.map((field) => {
        const value = draft[field.key];
        const suffix = field.kind === "stepper" ? ` ${field.unit}` : "";
        return `${field.label} — ${value ?? "—"}${suffix}`;
      })
    : [];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[520px] flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3 py-3">
        {index > 0 && step !== "done" && (
          <button
            type="button"
            aria-label="Назад"
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            className="-ml-2 rounded-full p-2 text-text-faint transition hover:text-text"
          >
            <Icon name="back" size={18} />
          </button>
        )}
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
        <span className="mono-label text-text-faint">
          {index + 1}/{steps.length}
        </span>
      </div>

      <div className="flex-1 pb-6">
        {step === "welcome" && <WelcomeStep />}
        {step === "privacy" && (
          <PrivacyStep
            consented={privacy.consented}
            anonymousMode={privacy.anonymousMode}
            onConsent={setConsent}
            onAnonymous={setAnonymousMode}
          />
        )}
        {step === "goal" && <GoalStep value={mode} onChange={chooseMode} />}
        {step === "stage" && mode && hasStages(mode) && (
          <StageStep mode={mode} value={stage} onChange={chooseStage} />
        )}
        {step === "fields" && mode && (
          <div className="pt-2">
            <h1 className="font-display text-[24px] font-semibold leading-tight text-text">
              Немного цифр — режим «{MODE_LABELS[mode]}»
            </h1>
            <p className="mt-2 text-[13px] leading-snug text-text-dim">
              По этим значениям считается дашборд. Уточнить их можно в любой момент в настройках.
            </p>
            <div className="mt-6">
              <ProfileFields mode={mode} stage={stage ?? undefined} draft={draft} onChange={setDraft} />
            </div>
          </div>
        )}
        {step === "baseline" && baselineInfo && (
          <BaselineStep group={baselineInfo.group} value={baseline} onChange={setBaseline} />
        )}
        {step === "done" && mode && <DoneStep mode={mode} summary={summaryLines} />}
      </div>

      <div className="space-y-2">
        {step === "done" ? (
          <Button onClick={finish}>Начать пользоваться Livi</Button>
        ) : (
          <Button disabled={!canAdvance} onClick={() => setIndex((value) => value + 1)}>
            {step === "welcome" ? "Начать" : "Далее"}
          </Button>
        )}
        {step === "privacy" && !privacy.consented && (
          <p className="pt-1 text-center text-[12px] text-text-faint">
            Без согласия дальше не пойдём — это осознанный шаг, а не мелкий текст внизу
          </p>
        )}
        {step === "baseline" && (
          <Button variant="ghost" onClick={() => setIndex((value) => value + 1)}>
            Пропустить шаг
          </Button>
        )}
      </div>
    </div>
  );
}
