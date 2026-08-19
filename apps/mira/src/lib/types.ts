export type Mode =
  | "cycle"
  | "ttc"
  | "pregnancy"
  | "postpartum"
  | "perimenopause"
  | "menopause";

export const MODES: Mode[] = [
  "cycle",
  "ttc",
  "pregnancy",
  "postpartum",
  "perimenopause",
  "menopause",
];

export type TabId =
  | "today"
  | "history"
  | "analytics"
  | "patterns"
  | "predictions";

/** Значение поля профиля: число (день/неделя/длина) или качественная метка. */
export type ProfileValue = number | string;

export interface Profile {
  /** Момент, от которого отсчитываются введённые пользователем значения. */
  updatedAt?: number;
  [key: string]: ProfileValue | undefined;
}

export interface LogEvent {
  id: string;
  mode: Mode;
  chipId: string;
  timestamp: number;
  /** Человекочитаемое резюме для History / «Записано сегодня». */
  summary: string;
  /** Значения multi-select групп — для частотного анализа. */
  multiLabels?: string[];
  /** Значение scale5-группы (1..5) — для трендов настроения. */
  scaleVal?: number;
  /** Значение temp/counter-группы — БТ, вес, шевеления. */
  numericVal?: number;
}

export interface Session {
  id: string;
  mode: Mode;
  kind: "workout" | "meditation";
  timestamp: number;
  summary: string;
  /** Тренировка: локация; медитация: длительность + музыка. */
  detail: string;
}

export interface PrivacyState {
  consented: boolean;
  anonymousMode: boolean;
}

export interface UndoBanner {
  from: Mode;
  to: Mode;
}

export interface AppData {
  mode: Mode;
  onboarded: boolean;
  profile: Record<Mode, Profile>;
  logEvents: Record<Mode, LogEvent[]>;
  sessions: Record<Mode, Session[]>;
  privacy: PrivacyState;
}

export type ConfidenceTier = "LOW" | "MEDIUM" | "HIGH";
