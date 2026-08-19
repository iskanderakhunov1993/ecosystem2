export type Mode = "cycle" | "fertility" | "motherhood" | "menopause";

export const MODES: Mode[] = ["cycle", "fertility", "motherhood", "menopause"];

export type MotherhoodStage = "pregnancy" | "postpartum";
export type MenopauseStage = "perimenopause" | "menopause";
/** Второй уровень внутри motherhood/menopause. У cycle/fertility стадии нет. */
export type Stage = MotherhoodStage | MenopauseStage;

export const MOTHERHOOD_STAGES: MotherhoodStage[] = ["pregnancy", "postpartum"];
export const MENOPAUSE_STAGES: MenopauseStage[] = ["perimenopause", "menopause"];

/** Легаси-значения mode из версий до свода 6→4 — используются только в миграции. */
export type LegacyMode =
  | "cycle"
  | "ttc"
  | "pregnancy"
  | "postpartum"
  | "perimenopause"
  | "menopause";

/**
 * «История» убрана: календарь переехал в «Сегодня», где он и нужен — при отметке.
 * Аналитика, паттерны и прогнозы слиты в «Мой цикл»: это один вопрос пользователя,
 * а графики и детали прогноза уехали на второй уровень.
 */
export type TabId = "today" | "cycle";

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
  /** Заполнено, если вместе со сменой режима менялась и стадия. */
  fromStage?: Stage;
  toStage?: Stage;
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

/** Стадия — часть профиля текущего режима (см. Profile[key: string]). */
export function stageOf(profile: Profile | undefined): Stage | undefined {
  const value = profile?.stage;
  return typeof value === "string" ? (value as Stage) : undefined;
}
