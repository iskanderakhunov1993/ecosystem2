import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Toggle } from "@/components/Toggle";
import {
  ProfileFields,
  draftToProfile,
  initialDraft,
  isDraftComplete,
  type FieldDraft,
} from "@/components/ProfileFields";
import { Icon } from "@/data/icons";
import { MODE_LABELS } from "@/data/modes.config";
import { dateKey } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile[state.mode]);
  const profiles = useAppStore((state) => state.profile);
  const logEvents = useAppStore((state) => state.logEvents);
  const sessions = useAppStore((state) => state.sessions);
  const privacy = useAppStore((state) => state.privacy);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const setAnonymousMode = useAppStore((state) => state.setAnonymousMode);
  const wipeAllData = useAppStore((state) => state.wipeAllData);

  const [draft, setDraft] = useState<FieldDraft>(() => initialDraft(mode, profile));
  const [saved, setSaved] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const save = () => {
    saveProfile(mode, draftToProfile(mode, draft));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const exportData = () => {
    const payload = JSON.stringify(
      { exportedAt: new Date().toISOString(), profile: profiles, logs: logEvents, sessions },
      null,
      2,
    );
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mira-export-${dateKey(Date.now())}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <BottomSheet open title="Настройки" onClose={onClose}>
      <section>
        <h3 className="mono-label text-text-dim">Профиль · {MODE_LABELS[mode]}</h3>
        <p className="mt-2 text-[12px] leading-snug text-text-faint">
          Чтобы сменить этап — используй пилюлю режима вверху. Здесь можно только уточнить цифры в
          рамках текущего режима.
        </p>
        <div className="mt-4">
          <ProfileFields mode={mode} draft={draft} onChange={setDraft} />
        </div>
        <div className="mt-4">
          <Button disabled={!isDraftComplete(mode, draft)} onClick={save}>
            {saved ? "Сохранено" : "Сохранить изменения"}
          </Button>
        </div>
      </section>

      <hr className="my-6 border-border-soft" />

      <section>
        <h3 className="mono-label text-text-dim">Приватность</h3>

        <div className="mt-4 rounded-card border border-border bg-surface-2 p-4">
          <Toggle
            checked={privacy.anonymousMode}
            onChange={setAnonymousMode}
            label="Anonymous Mode"
            description="Скрывает Livi под нейтральной иконкой и именем"
          />
        </div>

        <button
          type="button"
          onClick={exportData}
          className="mt-3 flex w-full items-center gap-3 rounded-card border border-border bg-surface-2 p-4 text-left transition active:scale-[0.99]"
        >
          <span className="text-text-dim">
            <Icon name="download" size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-text">Экспортировать мои данные</span>
            <span className="mt-0.5 block text-[12px] text-text-dim">JSON-файл на устройство</span>
          </span>
        </button>

        <div className="mt-3 rounded-card border border-danger/40 bg-surface-2 p-4">
          {!deleteArmed ? (
            <button
              type="button"
              onClick={() => setDeleteArmed(true)}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className="text-danger">
                <Icon name="trash" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-danger">Удалить все данные</span>
                <span className="mt-0.5 block text-[12px] text-text-dim">
                  Профили, логи и сессии всех режимов
                </span>
              </span>
            </button>
          ) : (
            <div>
              <p className="text-[13px] leading-snug text-text">
                Это удалит профили, логи и сессии всех режимов без возможности восстановления. После
                удаления Livi вернётся к онбордингу — данных для дашборда больше не будет.
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    void wipeAllData();
                    onClose();
                  }}
                >
                  Да, удалить безвозвратно
                </Button>
                <Button variant="ghost" onClick={() => setDeleteArmed(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </BottomSheet>
  );
}
