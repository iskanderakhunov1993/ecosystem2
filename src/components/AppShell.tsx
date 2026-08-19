import { useEffect } from "react";
import { Icon, type IconName } from "@/data/icons";
import { MODE_LABELS, getCycleTabLabel } from "@/data/modes.config";
import { formatDate } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import { stageOf, type TabId } from "@/lib/types";
import { TodayScreen } from "@/features/today/TodayScreen";
import { CycleScreen } from "@/features/cycle/CycleScreen";
import { LogSheet } from "@/features/today/LogSheet";
import { WorkoutSheet } from "@/features/today/WorkoutSheet";
import { LifeStageGate } from "@/features/life-stage-gate/LifeStageGate";
import { SettingsSheet } from "@/features/settings/SettingsSheet";

const TAB_ICONS: Record<TabId, IconName> = {
  today: "today",
  cycle: "analytics",
};

const SCREENS: Record<TabId, () => JSX.Element> = {
  today: TodayScreen,
  cycle: CycleScreen,
};

export function AppShell() {
  const mode = useAppStore((state) => state.mode);
  const activeTab = useAppStore((state) => state.activeTab);
  const setTab = useAppStore((state) => state.setTab);
  const sheet = useAppStore((state) => state.sheet);
  const openSheet = useAppStore((state) => state.openSheet);
  const closeSheet = useAppStore((state) => state.closeSheet);
  const anonymous = useAppStore((state) => state.privacy.anonymousMode);
  const persistent = useAppStore((state) => state.persistent);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const stage = useAppStore((state) => stageOf(state.profile[state.mode]));

  useEffect(() => {
    document.title = anonymous ? "Заметки" : "Livi";
  }, [anonymous]);

  const Screen = SCREENS[activeTab];
  const tabs: { id: TabId; label: string; icon: IconName }[] = [
    { id: "today", label: "Сегодня", icon: TAB_ICONS.today },
    { id: "cycle", label: getCycleTabLabel(mode, stage), icon: TAB_ICONS.cycle },
  ];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[520px] flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border-soft bg-screen px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => openSheet({ type: "gate" })}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1.5 pl-3 pr-2.5 transition active:scale-[0.97]"
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-[13px] font-medium text-text">
            {anonymous ? "Режим" : MODE_LABELS[mode]}
          </span>
          <span className="text-text-faint">
            <Icon name="chevron" size={14} />
          </span>
        </button>

        <span className="mono-label flex-1 text-center text-text-dim">{formatDate(Date.now())}</span>

        <button
          type="button"
          aria-label="Настройки"
          onClick={() => openSheet({ type: "settings" })}
          className="rounded-full p-2 text-text-dim transition hover:text-text"
        >
          <Icon name="gear" size={19} />
        </button>
      </header>

      {!persistent && (
        <p className="mx-4 mt-3 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-[12px] leading-snug text-text-dim">
          Локальное хранилище недоступно — записи этой сессии не сохранятся после закрытия вкладки.
        </p>
      )}

      <main className="flex-1 px-4 py-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
        <Screen />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[520px] items-stretch border-t border-border bg-surface px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setTab(tab.id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition ${
                active ? "text-accent-text" : "text-text-faint"
              }`}
            >
              <Icon name={tab.icon} size={21} />
              <span className="text-[10px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {sheet?.type === "log" && (
        <LogSheet
          key={`${mode}-${sheet.chipId}-${sheet.date ?? 0}`}
          mode={mode}
          stage={stage}
          chipId={sheet.chipId}
          date={sheet.date}
          onClose={closeSheet}
        />
      )}
      {sheet?.type === "activity" && (
        <WorkoutSheet mode={mode} stage={stage} events={events} onClose={closeSheet} />
      )}
      {sheet?.type === "gate" && <LifeStageGate onClose={closeSheet} />}
      {sheet?.type === "settings" && <SettingsSheet onClose={closeSheet} />}
    </div>
  );
}
