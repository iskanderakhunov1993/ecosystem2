import type { MiraLocalData } from "./types";
import { dateKey } from "./store";
import { getSmartReminders } from "./alerts";
import { getDailyRitual } from "./gamification";
import { getNotificationCopy, getPersonalReminders, getReminderSettings } from "./personalReminders";

/* ──────────────────────────────────────────────
   Локальные уведомления (без сервера).
   Web Push с бэкендом — в бэклоге (#3). Здесь —
   честный клиентский слой: разрешение + показ
   напоминаний через Service Worker при заходе.
   ────────────────────────────────────────────── */

const PREF_KEY = "mira:notifications";
const LAST_SHOWN_KEY = "mira:notif-last";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return "denied";
  return Notification.permission;
}

export function notificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "on" && notificationPermission() === "granted";
}

export function setNotificationsPref(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREF_KEY, on ? "on" : "off");
}

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const res = await Notification.requestPermission();
  const granted = res === "granted";
  setNotificationsPref(granted);
  return granted;
}

async function show(title: string, body: string): Promise<void> {
  if (!notificationsEnabled()) return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "mira-daily",
      });
    } else {
      new Notification(title, { body, icon: "/icons/icon-192.png" });
    }
  } catch {
    /* тихо игнорируем — уведомления не критичны */
  }
}

/**
 * Показывает одно релевантное уведомление при заходе,
 * не чаще одного раза в день. Приоритет: напоминание > дневной ритуал.
 */
export async function maybeShowDailyNotification(data: MiraLocalData): Promise<void> {
  if (!notificationsEnabled()) return;
  const today = dateKey();
  if (localStorage.getItem(LAST_SHOWN_KEY) === today) return;

  const reminders = getSmartReminders(data);
  const personalReminders = getPersonalReminders(data);
  const reminderSettings = getReminderSettings(data);
  const ritual = getDailyRitual(data);

  let title: string | null = null;
  let body = "";

  if (personalReminders.length > 0) {
    const copy = getNotificationCopy(personalReminders[0], reminderSettings.quietText || !!data.profile?.hiddenNotifications);
    title = copy.title;
    body = copy.body;
  } else if (reminders.length > 0) {
    title = reminders[0].title;
    body = reminders[0].body;
  } else if (!ritual.done) {
    title = "Mira";
    body = "Отметься за 10 секунд — сад подрастёт 🌱";
  }

  if (title) {
    await show(title, body);
    localStorage.setItem(LAST_SHOWN_KEY, today);
  }
}
