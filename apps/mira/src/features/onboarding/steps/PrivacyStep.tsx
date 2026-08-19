import { Icon } from "@/data/icons";
import { Toggle } from "@/components/Toggle";

interface PrivacyStepProps {
  consented: boolean;
  anonymousMode: boolean;
  onConsent: (next: boolean) => void;
  onAnonymous: (next: boolean) => void;
}

export function PrivacyStep({ consented, anonymousMode, onConsent, onAnonymous }: PrivacyStepProps) {
  return (
    <div className="pt-2">
      <h1 className="font-display text-[24px] font-semibold leading-tight text-text">
        Твои данные — твои
      </h1>

      <ul className="mt-5 space-y-3">
        {[
          "Данные хранятся локально на устройстве и не передаются третьим лицам без твоего согласия.",
          "Экспортировать или удалить всё можно в любой момент в Settings.",
          "Можно включить Anonymous Mode — Mira будет скрыта под нейтральным именем и иконкой.",
        ].map((text) => (
          <li key={text} className="flex gap-3 rounded-card border border-border bg-surface p-3.5">
            <span className="mt-0.5 text-accent">
              <Icon name="shield" size={18} />
            </span>
            <span className="text-[13px] leading-snug text-text-dim">{text}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onConsent(!consented)}
        aria-pressed={consented}
        className={`mt-5 flex w-full items-start gap-3 rounded-card border p-4 text-left transition ${
          consented ? "border-accent bg-accent-soft" : "border-border bg-surface-2"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            consented ? "border-accent bg-accent text-[#12141A]" : "border-border"
          }`}
        >
          {consented && <Icon name="check" size={13} strokeWidth={2.4} />}
        </span>
        <span className="text-[14px] font-medium leading-snug text-text">
          Я согласна с тем, как Mira хранит и обрабатывает мои данные
        </span>
      </button>

      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <Toggle
          checked={anonymousMode}
          onChange={onAnonymous}
          label="Anonymous Mode"
          description="Скрывает Mira под нейтральной иконкой и именем"
        />
      </div>
    </div>
  );
}
