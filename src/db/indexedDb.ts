import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AppData, LogEvent, Mode, Profile, PrivacyState, Session } from "@/lib/types";
import { MODES } from "@/lib/types";

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

  const [mode, onboarded, privacy] = await Promise.all([
    db.get("meta", "mode") as Promise<Mode | undefined>,
    db.get("meta", "onboarded") as Promise<boolean | undefined>,
    db.get("meta", "privacy") as Promise<PrivacyState | undefined>,
  ]);

  const data: AppData = {
    mode: mode && MODES.includes(mode) ? mode : DEFAULT_DATA.mode,
    onboarded: onboarded === true,
    profile: emptyByMode<Profile>(() => ({})),
    logEvents: emptyByMode<LogEvent[]>(() => []),
    sessions: emptyByMode<Session[]>(() => []),
    privacy: privacy ?? { consented: false, anonymousMode: false },
  };

  for (const row of await db.getAll("profiles")) {
    if (MODES.includes(row.mode)) data.profile[row.mode] = row.profile;
  }
  for (const event of await db.getAll("logEvents")) {
    if (MODES.includes(event.mode)) data.logEvents[event.mode].push(event);
  }
  for (const session of await db.getAll("sessions")) {
    if (MODES.includes(session.mode)) data.sessions[session.mode].push(session);
  }

  for (const mode of MODES) {
    data.logEvents[mode].sort((a, b) => a.timestamp - b.timestamp);
    data.sessions[mode].sort((a, b) => a.timestamp - b.timestamp);
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
