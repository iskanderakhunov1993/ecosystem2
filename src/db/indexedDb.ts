import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AppData, LegacyMode, LogEvent, Mode, Profile, PrivacyState, Session, Stage } from "@/lib/types";
import { MODES } from "@/lib/types";

/**
 * Свод 6 legacy-режимов до 4 core mode + stage. `ttc` → `fertility`,
 * pregnancy/postpartum → `motherhood` + stage, perimenopause/menopause →
 * `menopause` + stage. Записи под старыми ключами мержатся в новые.
 */
function migrateLegacyMode(raw: unknown): { mode: Mode; stage?: Stage } {
  // Уже новый формат — пропускаем как есть, стадия читается из самого профиля.
  if (typeof raw === "string" && (MODES as string[]).includes(raw)) {
    return { mode: raw as Mode };
  }
  switch (raw as LegacyMode) {
    case "ttc":
      return { mode: "fertility" };
    case "pregnancy":
      return { mode: "motherhood", stage: "pregnancy" };
    case "postpartum":
      return { mode: "motherhood", stage: "postpartum" };
    case "perimenopause":
      return { mode: "menopause", stage: "perimenopause" };
    default:
      return { mode: "cycle" };
  }
}

/**
 * Локально-first хранилище. Никакой синхронизации в облако по умолчанию.
 * logEvents — append-only, запросы по режиму и по диапазону дат идут через индексы.
 */

const DB_NAME = "livi";
const DB_VERSION = 1;

interface LiviDB extends DBSchema {
  meta: {
    key: string;
    value: unknown;
  };
  profiles: {
    key: Mode;
    value: { mode: Mode; profile: Profile };
  };
  logEvents: {
    key: string;
    value: LogEvent;
    indexes: { "by-mode": Mode; "by-mode-time": [Mode, number] };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-mode": Mode; "by-mode-time": [Mode, number] };
  };
}

let dbPromise: Promise<IDBPDatabase<LiviDB>> | null = null;

function getDb(): Promise<IDBPDatabase<LiviDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LiviDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("meta");
        db.createObjectStore("profiles", { keyPath: "mode" });

        const logs = db.createObjectStore("logEvents", { keyPath: "id" });
        logs.createIndex("by-mode", "mode");
        logs.createIndex("by-mode-time", ["mode", "timestamp"]);

        const sessions = db.createObjectStore("sessions", { keyPath: "id" });
        sessions.createIndex("by-mode", "mode");
        sessions.createIndex("by-mode-time", ["mode", "timestamp"]);
      },
    });
  }
  return dbPromise;
}

/** IndexedDB может быть недоступен (приватный режим, отключённое хранилище). */
export async function isAvailable(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    await getDb();
    return true;
  } catch {
    return false;
  }
}

function emptyByMode<T>(factory: () => T): Record<Mode, T> {
  return MODES.reduce(
    (acc, mode) => {
      acc[mode] = factory();
      return acc;
    },
    {} as Record<Mode, T>,
  );
}

export const DEFAULT_DATA: AppData = {
  mode: "cycle",
  onboarded: false,
  profile: emptyByMode<Profile>(() => ({})),
  logEvents: emptyByMode<LogEvent[]>(() => []),
  sessions: emptyByMode<Session[]>(() => []),
  privacy: { consented: false, anonymousMode: false },
};

export async function loadAll(): Promise<AppData> {
  const db = await getDb();

  const [rawMode, onboarded, privacy] = await Promise.all([
    db.get("meta", "mode") as Promise<Mode | LegacyMode | undefined>,
    db.get("meta", "onboarded") as Promise<boolean | undefined>,
    db.get("meta", "privacy") as Promise<PrivacyState | undefined>,
  ]);

  const activeMapped = rawMode ? migrateLegacyMode(rawMode) : { mode: DEFAULT_DATA.mode };
  const mode = MODES.includes(activeMapped.mode) ? activeMapped.mode : DEFAULT_DATA.mode;

  const data: AppData = {
    mode,
    onboarded: onboarded === true,
    profile: emptyByMode<Profile>(() => ({})),
    logEvents: emptyByMode<LogEvent[]>(() => []),
    sessions: emptyByMode<Session[]>(() => []),
    privacy: privacy ?? { consented: false, anonymousMode: false },
  };

  // Легаси-профили под старыми ключами мержатся в новые: приоритет — тот,
  // чья стадия совпадает с текущей активной, иначе самый свежий по updatedAt.
  const profileCandidates: Record<Mode, { profile: Profile; stage?: Stage }[]> = emptyByMode(() => []);
  for (const row of await db.getAll("profiles")) {
    const mapped = migrateLegacyMode(row.mode);
    profileCandidates[mapped.mode].push({ profile: row.profile, stage: mapped.stage });
  }
  for (const newMode of MODES) {
    const candidates = profileCandidates[newMode];
    if (candidates.length === 0) continue;
    const matched = newMode === mode ? candidates.find((c) => c.stage === activeMapped.stage) : undefined;
    const preferred =
      matched ??
      candidates.reduce((best, c) =>
        (c.profile.updatedAt ?? 0) > (best.profile.updatedAt ?? 0) ? c : best,
      );
    data.profile[newMode] = preferred.stage
      ? { ...preferred.profile, stage: preferred.stage }
      : preferred.profile;
  }

  for (const event of await db.getAll("logEvents")) {
    const mapped = migrateLegacyMode(event.mode);
    data.logEvents[mapped.mode].push({ ...event, mode: mapped.mode });
  }
  for (const session of await db.getAll("sessions")) {
    const mapped = migrateLegacyMode(session.mode);
    data.sessions[mapped.mode].push({ ...session, mode: mapped.mode });
  }

  for (const m of MODES) {
    data.logEvents[m].sort((a, b) => a.timestamp - b.timestamp);
    data.sessions[m].sort((a, b) => a.timestamp - b.timestamp);
  }

  return data;
}

export async function putMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put("meta", value, key);
}

export async function putProfile(mode: Mode, profile: Profile): Promise<void> {
  const db = await getDb();
  await db.put("profiles", { mode, profile });
}

export async function putLogEvent(event: LogEvent): Promise<void> {
  const db = await getDb();
  await db.put("logEvents", event);
}

export async function putSession(session: Session): Promise<void> {
  const db = await getDb();
  await db.put("sessions", session);
}

/** Запрос по диапазону дат — то, ради чего выбран IndexedDB, а не localStorage. */
export async function getLogEventsInRange(
  mode: Mode,
  fromTs: number,
  toTs: number,
): Promise<LogEvent[]> {
  const db = await getDb();
  return db.getAllFromIndex(
    "logEvents",
    "by-mode-time",
    IDBKeyRange.bound([mode, fromTs], [mode, toTs]),
  );
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["meta", "profiles", "logEvents", "sessions"], "readwrite");
  await Promise.all([
    tx.objectStore("meta").clear(),
    tx.objectStore("profiles").clear(),
    tx.objectStore("logEvents").clear(),
    tx.objectStore("sessions").clear(),
    tx.done,
  ]);
}
