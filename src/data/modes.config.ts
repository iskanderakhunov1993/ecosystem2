import type { IconName } from "@/data/icons";
import type { MenopauseStage, Mode, MotherhoodStage, Stage } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Акценты режимов и стадий                                            */
/* ------------------------------------------------------------------ */

export interface AccentTokens {
  accent: string;
  accentText: string;
  accentSoft: string;
}

/** Акцент режима по умолчанию — используется, пока стадия не выбрана. */
export const MODE_ACCENTS: Record<Mode, AccentTokens> = {
  cycle: { accent: "#F2637A", accentText: "#FF93A5", accentSoft: "rgba(242,99,122,0.14)" },
  fertility: { accent: "#E7A33E", accentText: "#F2C066", accentSoft: "rgba(231,163,62,0.14)" },
  motherhood: { accent: "#7BC6A4", accentText: "#9BE0C0", accentSoft: "rgba(123,198,164,0.14)" },
  menopause: { accent: "#9C8AD9", accentText: "#C0B3EA", accentSoft: "rgba(156,138,217,0.14)" },
};

/** Стадия внутри motherhood/menopause переопределяет акцент режима. */
export const STAGE_ACCENTS: Record<Stage, AccentTokens> = {
  pregnancy: { accent: "#7BC6A4", accentText: "#9BE0C0", accentSoft: "rgba(123,198,164,0.14)" },
  postpartum: { accent: "#8E9BFF", accentText: "#B2BCFF", accentSoft: "rgba(142,155,255,0.14)" },
  perimenopause: { accent: "#D98C5F", accentText: "#EBB58C", accentSoft: "rgba(217,140,95,0.14)" },
  menopause: { accent: "#9C8AD9", accentText: "#C0B3EA", accentSoft: "rgba(156,138,217,0.14)" },
};

export function getAccent(mode: Mode, stage?: Stage): AccentTokens {
  return stage ? STAGE_ACCENTS[stage] : MODE_ACCENTS[mode];
}

export const MODE_LABELS: Record<Mode, string> = {
  cycle: "Цикл",
  fertility: "Планирую",
  motherhood: "Беременность и после родов",
  menopause: "Цикл меняется / менопауза",
};

export const STAGE_LABELS: Record<Stage, string> = {
  pregnancy: "Беременность",
  postpartum: "После родов",
  perimenopause: "Цикл меняется",
  menopause: "Менопауза",
};

/* ------------------------------------------------------------------ */
/* Онбординг + life-stage gate: выбор режима, затем стадии              */
/* ------------------------------------------------------------------ */

export interface CoreModeOption {
  mode: Mode;
  title: string;
  hint: string;
}

export const CORE_MODES: CoreModeOption[] = [
  { mode: "cycle", title: "Отслеживать цикл", hint: "Стандартный трекинг цикла" },
  { mode: "fertility", title: "Планирую беременность", hint: "Окно фертильности, попытки" },
  { mode: "motherhood", title: "Беременность и после родов", hint: "Определим стадию по неделям/дням" },
  { mode: "menopause", title: "Цикл меняется / менопауза", hint: "Нерегулярно или год+ без цикла" },
];

export interface StageOption {
  stage: Stage;
  title: string;
  hint: string;
  /** Soft prompt вместо hard gate — самоотчёт, а не объективное событие. */
  soft?: boolean;
}

/** Стадии показываются вторым шагом того же bottom sheet только для motherhood/menopause. */
export const STAGE_OPTIONS: Record<"motherhood" | "menopause", StageOption[]> = {
  motherhood: [
    { stage: "pregnancy", title: "Я беременна", hint: "Тест положительный" },
    { stage: "postpartum", title: "Недавно родила", hint: "Восстановление после родов" },
  ],
  menopause: [
    {
      stage: "perimenopause",
      title: "Цикл меняется",
      hint: "Нерегулярный цикл 3+ месяца",
      soft: true,
    },
    { stage: "menopause", title: "Год и более без менструации", hint: "Менопауза подтверждена" },
  ],
};

export const SOFT_PROMPT_TEXT =
  "Нерегулярный цикл — это не всегда перименопауза: причиной может быть стресс, смена часовых поясов, перелёты, резкая смена веса. Если это повторяется несколько месяцев подряд — стоит присмотреться внимательнее. Решать тебе.";

export const GATE_INTRO_TEXT =
  "Режим меняется по значимым событиям, а не вручную — так прогнозы и трекеры остаются точными для твоей ситуации сейчас.";

/**
 * Экран между выбором «Отслеживать цикл» и обычным подтверждением, если
 * человек сейчас в motherhood. Без слова «завершить», без поздравлений.
 * TODO: заменить плейсхолдер на реальный контакт линии поддержки, когда он появится.
 */
export const PREGNANCY_EXIT_TITLE = "Беременность больше не отслеживаем";
export const PREGNANCY_EXIT_TEXT =
  "Это может значить что угодно — и это твоё дело, не наше. Данные о беременности никуда не денутся: они сохранены, просто больше не на виду. Если нужно поговорить с кем-то — рядом есть служба поддержки.";

/** Подпись второй вкладки — по режиму и стадии, вопрос у каждой стадии свой. */
export const CYCLE_TAB_LABEL: Record<Mode, string> = {
  cycle: "Мой цикл",
  fertility: "Мой цикл",
  motherhood: "Мой цикл",
  menopause: "Мой цикл",
};

export const CYCLE_TAB_LABEL_BY_STAGE: Partial<Record<Stage, string>> = {
  pregnancy: "Мой срок",
  postpartum: "Мой путь",
  menopause: "Моё тело",
};

export function getCycleTabLabel(mode: Mode, stage?: Stage): string {
  return (stage && CYCLE_TAB_LABEL_BY_STAGE[stage]) ?? CYCLE_TAB_LABEL[mode];
}

/* ------------------------------------------------------------------ */
/* Поля профиля / онбординга                                           */
/* ------------------------------------------------------------------ */

export type OnboardField =
  | {
      kind: "chips";
      key: string;
      label: string;
      options: string[];
      /** Если задан — в профиль пишется число из этой карты, иначе подпись. */
      valueMap?: number[];
    }
  | {
      kind: "stepper";
      key: string;
      label: string;
      min: number;
      max: number;
      step?: number;
      default: number;
      unit: string;
    };

export interface OnboardModeConfig {
  fields: OnboardField[];
  /** Baseline-шаг доступен только там, где есть подходящий multi-чип. */
  baselineChipId?: string;
}

const LAST_PERIOD_FIELD: OnboardField = {
  kind: "chips",
  key: "lastPeriodDays",
  label: "Когда началась последняя менструация?",
  options: ["Сегодня", "3 дня назад", "Неделю назад", "2 недели назад", "3+ недели назад", "Не помню"],
  // -1 — сентинел «не помню»: derive.ts проверяет lastPeriodDaysLabel, не это число.
  valueMap: [0, 3, 7, 14, 25, -1],
};

const CYCLE_LEN_FIELD: OnboardField = {
  kind: "stepper",
  key: "cycleLen",
  label: "Обычная длина цикла",
  min: 21,
  max: 40,
  default: 28,
  unit: "дней",
};

/** Онбординг для режимов без стадии: cycle, fertility. */
export const ONBOARD_CONFIG: Record<"cycle" | "fertility", OnboardModeConfig> = {
  cycle: {
    fields: [LAST_PERIOD_FIELD, CYCLE_LEN_FIELD],
    baselineChipId: "symptom",
  },
  fertility: {
    fields: [
      LAST_PERIOD_FIELD,
      CYCLE_LEN_FIELD,
      {
        kind: "chips",
        key: "tryingFor",
        label: "Как долго планируете?",
        options: ["<1 месяца", "1–3 месяца", "4–6 месяцев", "6+ месяцев"],
      },
    ],
  },
};

/** Онбординг для стадий motherhood/menopause. */
export const ONBOARD_STAGE_CONFIG: Record<Stage, OnboardModeConfig> = {
  pregnancy: {
    fields: [
      { kind: "stepper", key: "week", label: "Срок беременности", min: 1, max: 40, default: 8, unit: "нед" },
    ],
    baselineChipId: "symptom",
  },
  postpartum: {
    fields: [
      { kind: "stepper", key: "daysAfter", label: "Дней после родов", min: 1, max: 120, default: 14, unit: "дн" },
    ],
  },
  perimenopause: {
    fields: [
      {
        kind: "chips",
        key: "irregularFor",
        label: "Как долго цикл нерегулярен?",
        options: ["<3 месяцев", "3–6 месяцев", "6–12 месяцев", "1+ год"],
      },
    ],
  },
  menopause: {
    fields: [
      { kind: "stepper", key: "monthsSince", label: "Месяцев без менструации", min: 12, max: 120, default: 12, unit: "мес" },
    ],
  },
};

/** Единая точка входа: cycle/fertility по mode, motherhood/menopause по stage. */
export function getOnboardConfig(mode: Mode, stage?: Stage): OnboardModeConfig {
  if (stage) return ONBOARD_STAGE_CONFIG[stage];
  return ONBOARD_CONFIG[mode as "cycle" | "fertility"];
}

/* ------------------------------------------------------------------ */
/* Быстрый лог на Today                                                */
/* ------------------------------------------------------------------ */

export type LogGroupType = "single" | "multi" | "scale5" | "counter" | "temp";

export interface LogGroup {
  id: string;
  label: string;
  type: LogGroupType;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  unit?: string;
}

export interface ChipConfig {
  id: string;
  label: string;
  icon: IconName;
  groups: LogGroup[];
}

export const MOOD_SCALE = ["😞", "🙁", "😐", "🙂", "😄"];
export const MOOD_SCALE_LABELS = ["Плохо", "Так себе", "Нормально", "Хорошо", "Отлично"];

const MOOD_CHIP: ChipConfig = {
  id: "mood",
  label: "Настроение",
  icon: "mood",
  groups: [{ id: "mood", label: "Как ты себя чувствуешь?", type: "scale5" }],
};

const MORE_CHIP: ChipConfig = {
  id: "more",
  label: "Ещё",
  icon: "more",
  groups: [
    {
      id: "activity",
      label: "Что ещё сегодня было?",
      type: "multi",
      options: ["Вода 2л+", "Прогулка", "Секс", "Витамины", "Стресс", "Алкоголь", "Кофеин", "Путешествие"],
    },
  ],
};

const SLEEP_QUALITY_GROUP: LogGroup = {
  id: "quality",
  label: "Качество сна",
  type: "single",
  options: ["Плохо спала", "С перерывами", "Нормально", "Отлично"],
};

const HOTFLASH_GROUPS: LogGroup[] = [
  { id: "intensity", label: "Интенсивность прилива", type: "single", options: ["Лёгкий", "Средний", "Сильный"] },
  {
    id: "triggers",
    label: "Возможные триггеры",
    type: "multi",
    options: ["Стресс", "Кофеин", "Алкоголь", "Погода", "Не знаю"],
  },
];

const FLOW_GROUP: LogGroup = {
  id: "flow",
  label: "Интенсивность выделений",
  type: "single",
  options: ["Мажущие", "Слабые", "Средние", "Обильные"],
};

/** Чипы для режимов без стадии: cycle, fertility. */
export const QUICK_LOG: Record<"cycle" | "fertility", ChipConfig[]> = {
  cycle: [
    MOOD_CHIP,
    { id: "flow", label: "Выделения", icon: "flow", groups: [FLOW_GROUP] },
    {
      id: "symptom",
      label: "Симптомы",
      icon: "symptom",
      groups: [
        {
          id: "symptom",
          label: "Что беспокоит?",
          type: "multi",
          options: ["Спазмы", "Головная боль", "Вздутие", "Усталость", "Тошнота", "Боль в груди", "Акне", "Тяга к еде"],
        },
      ],
    },
    {
      id: "sleep",
      label: "Сон",
      icon: "sleep",
      groups: [{ id: "duration", label: "Сколько спала?", type: "single", options: ["<5ч", "5–6ч", "7–8ч", "9+ч"] }],
    },
    MORE_CHIP,
  ],
  fertility: [
    {
      id: "bbt",
      label: "БТ",
      icon: "bbt",
      groups: [
        { id: "bbt", label: "Базальная температура", type: "temp", min: 36, max: 37.5, step: 0.05, default: 36.6, unit: "°C" },
      ],
    },
    {
      id: "opk",
      label: "Тест на овуляцию",
      icon: "opk",
      groups: [
        { id: "opk", label: "Результат теста", type: "single", options: ["Отрицательный", "Слабо-положительный", "Положительный"] },
      ],
    },
    {
      id: "mucus",
      label: "Выделения",
      icon: "mucus",
      groups: [
        {
          id: "mucus",
          label: "Цервикальная слизь",
          type: "single",
          options: ["Сухо", "Липкие", "Кремообразные", "Яичный белок", "Водянистые"],
        },
      ],
    },
    MOOD_CHIP,
    MORE_CHIP,
  ],
};

/** Чипы для стадий motherhood/menopause. */
export const QUICK_LOG_BY_STAGE: Record<Stage, ChipConfig[]> = {
  pregnancy: [
    {
      id: "symptom",
      label: "Симптомы",
      icon: "symptom",
      groups: [
        {
          id: "symptom",
          label: "Что беспокоит?",
          type: "multi",
          options: ["Изжога", "Тошнота", "Отёки", "Боль в спине", "Судороги", "Бессонница", "Тяга к еде"],
        },
      ],
    },
    {
      id: "movement",
      label: "Шевеления",
      icon: "movement",
      groups: [{ id: "movement", label: "Шевеления за час", type: "counter", min: 0, max: 50, default: 0, unit: "толчков" }],
    },
    {
      id: "weight",
      label: "Вес",
      icon: "weight",
      groups: [{ id: "weight", label: "Текущий вес", type: "temp", min: 45, max: 120, step: 0.1, default: 65, unit: "кг" }],
    },
    MOOD_CHIP,
    MORE_CHIP,
  ],
  postpartum: [
    {
      id: "feeding",
      label: "Кормление",
      icon: "feeding",
      groups: [
        { id: "type", label: "Тип кормления", type: "single", options: ["Грудь Л", "Грудь П", "Бутылочка", "Смесь"] },
        { id: "duration", label: "Длительность", type: "single", options: ["5 мин", "10 мин", "15 мин", "20+ мин"] },
      ],
    },
    {
      id: "diaper",
      label: "Подгузник",
      icon: "diaper",
      groups: [{ id: "diaper", label: "Что было", type: "single", options: ["Мокрый", "Грязный", "Оба", "Сухой"] }],
    },
    {
      id: "sleep",
      label: "Сон",
      icon: "sleep",
      groups: [{ id: "duration", label: "Сколько удалось поспать?", type: "single", options: ["<2ч", "2–3ч", "3–4ч", "4+ч"] }],
    },
    MOOD_CHIP,
    MORE_CHIP,
  ],
  perimenopause: [
    { id: "hotflash", label: "Приливы", icon: "hotflash", groups: HOTFLASH_GROUPS },
    MOOD_CHIP,
    { id: "sleep", label: "Сон", icon: "sleep", groups: [SLEEP_QUALITY_GROUP] },
    { id: "flow", label: "Выделения", icon: "flow", groups: [FLOW_GROUP] },
    MORE_CHIP,
  ],
  menopause: [
    { id: "hotflash", label: "Приливы", icon: "hotflash", groups: HOTFLASH_GROUPS },
    MOOD_CHIP,
    { id: "sleep", label: "Сон", icon: "sleep", groups: [SLEEP_QUALITY_GROUP] },
    {
      id: "weight",
      label: "Вес",
      icon: "weight",
      groups: [{ id: "weight", label: "Текущий вес", type: "temp", min: 45, max: 120, step: 0.1, default: 65, unit: "кг" }],
    },
    MORE_CHIP,
  ],
};

/** Единая точка входа: cycle/fertility по mode, motherhood/menopause по stage. */
export function getQuickLog(mode: Mode, stage?: Stage): ChipConfig[] {
  if (stage) return QUICK_LOG_BY_STAGE[stage];
  return QUICK_LOG[mode as "cycle" | "fertility"];
}

export function getChipConfig(mode: Mode, stage: Stage | undefined, chipId: string): ChipConfig | undefined {
  return getQuickLog(mode, stage).find((chip) => chip.id === chipId);
}

/* ------------------------------------------------------------------ */
/* Тренировки и медитация                                              */
/* ------------------------------------------------------------------ */

export type LocationId = "street" | "home" | "gym" | "mat";
export type Intensity = "low" | "medium" | "high";

export const LOCATIONS: { id: LocationId; label: string; icon: IconName }[] = [
  { id: "street", label: "Улица", icon: "street" },
  { id: "home", label: "Дом", icon: "home" },
  { id: "gym", label: "Тренажёрка", icon: "gym" },
  { id: "mat", label: "Коврик", icon: "mat" },
];

export interface ExerciseTemplate {
  name: string;
  detail: string;
}

type Pool = Record<LocationId, ExerciseTemplate[]>;

export const WORKOUT_POOLS: Record<Intensity, Pool> = {
  low: {
    street: [
      { name: "Спокойная ходьба", detail: "15 минут в комфортном темпе" },
      { name: "Дыхание на ходу", detail: "5 минут: вдох 4 шага, выдох 6 шагов" },
      { name: "Растяжка икр", detail: "2 подхода по 30 секунд на ногу" },
    ],
    home: [
      { name: "Разминка суставов", detail: "5 минут сверху вниз" },
      { name: "Приседания к стулу", detail: "2 подхода по 8 повторений" },
      { name: "Растяжка спины", detail: "3 минуты, без усилия" },
    ],
    gym: [
      { name: "Дорожка, шаг", detail: "12 минут, наклон 0" },
      { name: "Тяга верхнего блока", detail: "2 подхода по 10, малый вес" },
      { name: "Заминка на велотренажёре", detail: "5 минут" },
    ],
    mat: [
      { name: "Поза ребёнка", detail: "2 минуты" },
      { name: "Кошка-корова", detail: "10 медленных циклов" },
      { name: "Скрутка лёжа", detail: "по 1 минуте на сторону" },
    ],
  },
  medium: {
    street: [
      { name: "Быстрая ходьба", detail: "25 минут" },
      { name: "Подъём по лестнице", detail: "4 подхода по 1 пролёту" },
      { name: "Выпады на месте", detail: "2 подхода по 10 на ногу" },
    ],
    home: [
      { name: "Приседания", detail: "3 подхода по 12" },
      { name: "Планка", detail: "3 подхода по 30 секунд" },
      { name: "Ягодичный мостик", detail: "3 подхода по 12" },
      { name: "Растяжка", detail: "5 минут" },
    ],
    gym: [
      { name: "Дорожка, лёгкий бег", detail: "15 минут" },
      { name: "Жим ногами", detail: "3 подхода по 10" },
      { name: "Тяга гантели в наклоне", detail: "3 подхода по 10 на руку" },
    ],
    mat: [
      { name: "Приветствие солнцу", detail: "5 циклов" },
      { name: "Планка с опорой на предплечья", detail: "3 подхода по 30 секунд" },
      { name: "Растяжка бёдер", detail: "по 1 минуте на сторону" },
    ],
  },
  high: {
    street: [
      { name: "Интервальный бег", detail: "6 × (1 минута бег / 2 минуты шаг)" },
      { name: "Выпрыгивания", detail: "3 подхода по 10" },
      { name: "Заминка шагом", detail: "8 минут" },
    ],
    home: [
      { name: "Берпи", detail: "4 подхода по 8" },
      { name: "Приседания с прыжком", detail: "4 подхода по 12" },
      { name: "Планка с касанием плеч", detail: "3 подхода по 40 секунд" },
      { name: "Растяжка", detail: "5 минут" },
    ],
    gym: [
      { name: "Гребной тренажёр", detail: "10 минут в темпе" },
      { name: "Приседания со штангой", detail: "4 подхода по 8" },
      { name: "Становая тяга с гантелями", detail: "3 подхода по 10" },
      { name: "Заминка", detail: "5 минут" },
    ],
    mat: [
      { name: "Динамическая йога", detail: "20 минут в потоке" },
      { name: "Боковая планка", detail: "3 подхода по 30 секунд на сторону" },
      { name: "Скручивания", detail: "3 подхода по 15" },
    ],
  },
};

/** Отдельный щадящий пул: не зависит от readiness score. Ключ — стадия motherhood. */
export const SAFE_POOLS: Record<MotherhoodStage, Pool> = {
  pregnancy: {
    street: [
      { name: "Прогулка в комфортном темпе", detail: "20 минут, без одышки" },
      { name: "Дыхание с удлинённым выдохом", detail: "5 минут" },
    ],
    home: [
      { name: "Разминка плеч и шеи", detail: "5 минут" },
      { name: "Приседания с опорой на стул", detail: "2 подхода по 8" },
      { name: "Растяжка боков сидя", detail: "по 45 секунд на сторону" },
    ],
    gym: [
      { name: "Велотренажёр, лёгкое сопротивление", detail: "12 минут" },
      { name: "Тяга блока сидя, малый вес", detail: "2 подхода по 10" },
    ],
    mat: [
      { name: "Кошка-корова", detail: "10 медленных циклов" },
      { name: "Поза бабочки", detail: "2 минуты" },
      { name: "Дыхательная пауза лёжа на боку", detail: "3 минуты" },
    ],
  },
  postpartum: {
    street: [
      { name: "Прогулка с коляской", detail: "15 минут" },
      { name: "Дыхание диафрагмой стоя", detail: "5 минут" },
    ],
    home: [
      { name: "Диафрагмальное дыхание", detail: "3 подхода по 8 вдохов" },
      { name: "Ягодичный мостик без веса", detail: "2 подхода по 8" },
      { name: "Растяжка грудного отдела", detail: "3 минуты" },
    ],
    gym: [
      { name: "Ходьба на дорожке", detail: "12 минут, наклон 0" },
      { name: "Тяга блока сидя, малый вес", detail: "2 подхода по 10" },
    ],
    mat: [
      { name: "Дыхание лёжа с подтяжкой таза", detail: "3 подхода по 8" },
      { name: "Поза ребёнка", detail: "2 минуты" },
      { name: "Растяжка шеи сидя", detail: "по 45 секунд на сторону" },
    ],
  },
};

export const SAFE_POOL_DISCLAIMER =
  "Программа щадящая по умолчанию. Перед тренировками стоит обсудить нагрузку с квалифицированным врачом.";

/** Медитация для режимов без стадии. */
export const MEDITATION_PROMPTS: Record<"cycle" | "fertility", string> = {
  cycle: "Дыхательная практика для снижения напряжения перед месячными",
  fertility: "Практика на снижение тревоги ожидания",
};

/** Медитация для стадий motherhood/menopause. */
export const MEDITATION_PROMPTS_BY_STAGE: Record<Stage, string> = {
  pregnancy: "Спокойное дыхание и контакт с телом",
  postpartum: "Короткая пауза для восстановления между делами",
  perimenopause: "Практика на охлаждение и заземление при приливах",
  menopause: "Вечерняя практика для более спокойного сна",
};

export function getMeditationPrompt(mode: Mode, stage?: Stage): string {
  if (stage) return MEDITATION_PROMPTS_BY_STAGE[stage];
  return MEDITATION_PROMPTS[mode as "cycle" | "fertility"];
}

export const MEDITATION_DURATIONS = [5, 10, 15, 20];
export const MEDITATION_SOUNDS = ["Природа", "Белый шум", "Инструментал", "Тишина"];

export type { MenopauseStage, MotherhoodStage, Stage };
