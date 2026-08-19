import { create } from "zustand";
import * as db from "@/db/indexedDb";
import { getAccent } from "@/data/modes.config";
import type {
  AppData,
  LogEvent,
  Mode,
  PrivacyState,
  Profile,
  Session,
  Stage,
  TabId,
  UndoBanner,
} from "@/lib/types";
import { stageOf } from "@/lib/types";

export type SheetState =
  | { type: "log"; chipId: string; date?: number }
  | { type: "gate" }
  | { type: "settings" }
  | null;

interface AppState extends AppData {
  hydrated: boolean;
  persistent: boolean;
  activeTab: TabId;
  sheet: SheetState;
  undoBanner: UndoBanner | null;

  hydrate: () => Promise<void>;
  setTab: (tab: TabId) => void;
  openSheet: (sheet: NonNullable<SheetState>) => void;
  closeSheet: () => void;

  setConsent: (consented: boolean) => void;
  setAnonymousMode: (on: boolean) => void;

  saveProfile: (mode: Mode, profile: Profile) => void;
  completeOnboarding: (mode: Mode, profile: Profile) => void;

  /** Переключение режима — только через Life-Stage Gate. */
  switchMode: (target: Mode, profile: Profile) => void;
  /** Смена стадии внутри текущего mode (motherhood/menopause) — тот же Gate, второй шаг. */
  setStage: (stage: Stage) => void;
  undoModeSwitch: () => void;
  dismissUndoBanner: () => void;

  addLogEvent: (event: Omit<LogEvent, "id" | "timestamp"> & { timestamp?: number }) => void;
  addSession: (session: Omit<Session, "id" | "timestamp"> & { timestamp?: number }) => void;

  wipeAllData: () => Promise<void>;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Единственное место, где режим (и стадия) влияют на палитру. */
export function applyAccent(mode: Mode, stage?: Stage): void {
  if (typeof document === "undefined") return;
  const { accent, accentText, accentSoft } = getAccent(mode, stage);
  const root = document.documentElement;
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-text", accentText);
  root.style.setProperty("--accent-soft", accentSoft);
}

export const useAppStore = create<AppState>((set, get) => ({
  ...db.DEFAULT_DATA,
  hydrated: false,
  persistent: true,
  activeTab: "today",
  sheet: null,
  undoBanner: null,

  hydrate: async () => {
    let data: AppData = db.DEFAULT_DATA;
    let persistent = true;
    try {
      if (await db.isAvailable()) {
        data = await db.loadAll();
      } else {
        persistent = false;
      }
    } catch {
      persistent = false;
    }
    applyAccent(data.mode, stageOf(data.profile[data.mode]));
    set({ ...data, persistent, hydrated: true });
  },

  setTab: (activeTab) => set({ activeTab }),
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),

  setConsent: (consented) => {
    const privacy: PrivacyState = { ...get().privacy, consented };
    set({ privacy });
    void db.putMeta("privacy", privacy).catch(() => undefined);
  },

  setAnonymousMode: (anonymousMode) => {
    const privacy: PrivacyState = { ...get().privacy, anonymousMode };
    set({ privacy });
    void db.putMeta("privacy", privacy).catch(() => undefined);
  },

  saveProfile: (mode, profile) => {
    const next: Profile = { ...profile, updatedAt: Date.now() };
    set({ profile: { ...get().profile, [mode]: next } });
    void db.putProfile(mode, next).catch(() => undefined);
  },

  completeOnboarding: (mode, profile) => {
    const next: Profile = { ...profile, updatedAt: Date.now() };
    set({
      mode,
      onboarded: true,
      activeTab: "today",
      profile: { ...get().profile, [mode]: next },
    });
    applyAccent(mode, stageOf(next));
    void Promise.all([
      db.putMeta("mode", mode),
      db.putMeta("onboarded", true),
      db.putProfile(mode, next),
    ]).catch(() => undefined);
  },

  switchMode: (target, profile) => {
    const from = get().mode;
    if (from === target) return;
    const next: Profile = { ...profile, updatedAt: Date.now() };
    set({
      mode: target,
      activeTab: "today",
      sheet: null,
      profile: { ...get().profile, [target]: next },
      undoBanner: {
        from,
        to: target,
        fromStage: stageOf(get().profile[from]),
        toStage: stageOf(next),
      },
    });
    applyAccent(target, stageOf(next));
    void Promise.all([db.putMeta("mode", target), db.putProfile(target, next)]).catch(
      () => undefined,
    );
  },

  setStage: (stage) => {
    const mode = get().mode;
    const current = get().profile[mode];
    const fromStage = stageOf(current);
    if (fromStage === stage) return;
    const next: Profile = { ...current, stage, updatedAt: Date.now() };
    set({
      profile: { ...get().profile, [mode]: next },
      sheet: null,
      undoBanner: { from: mode, to: mode, fromStage, toStage: stage },
    });
    applyAccent(mode, stage);
    void db.putProfile(mode, next).catch(() => undefined);
  },

  undoModeSwitch: () => {
    const banner = get().undoBanner;
    if (!banner) return;
    // Профиль режима, из которого откатываемся, сохраняется — при повторном
    // переключении поля уже будут заполнены.
    if (banner.from === banner.to) {
      // Откат смены стадии внутри того же режима.
      const current = get().profile[banner.from];
      const reverted: Profile = { ...current, stage: banner.fromStage, updatedAt: Date.now() };
      set({ profile: { ...get().profile, [banner.from]: reverted }, undoBanner: null });
      applyAccent(banner.from, banner.fromStage);
      void db.putProfile(banner.from, reverted).catch(() => undefined);
      return;
    }
    set({ mode: banner.from, activeTab: "today", undoBanner: null });
    applyAccent(banner.from, banner.fromStage);
    void db.putMeta("mode", banner.from).catch(() => undefined);
  },

  dismissUndoBanner: () => set({ undoBanner: null }),

  addLogEvent: (input) => {
    const event: LogEvent = {
      ...input,
      id: newId(),
      timestamp: input.timestamp ?? Date.now(),
    };
    const byMode = get().logEvents;
    set({ logEvents: { ...byMode, [event.mode]: [...byMode[event.mode], event] } });
    void db.putLogEvent(event).catch(() => undefined);
  },

  addSession: (input) => {
    const session: Session = {
      ...input,
      id: newId(),
      timestamp: input.timestamp ?? Date.now(),
    };
    const byMode = get().sessions;
    set({ sessions: { ...byMode, [session.mode]: [...byMode[session.mode], session] } });
    void db.putSession(session).catch(() => undefined);
  },

  wipeAllData: async () => {
    try {
      await db.clearAll();
    } catch {
      /* хранилище недоступно — состояние всё равно сбрасываем */
    }
    set({
      ...db.DEFAULT_DATA,
      profile: { ...db.DEFAULT_DATA.profile },
      logEvents: { ...db.DEFAULT_DATA.logEvents },
      sessions: { ...db.DEFAULT_DATA.sessions },
      privacy: { consented: false, anonymousMode: false },
      activeTab: "today",
      sheet: null,
      undoBanner: null,
    });
    applyAccent(db.DEFAULT_DATA.mode);
  },
}));
