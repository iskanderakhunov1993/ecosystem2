export type AgeGroup = "teen" | "young" | "mature" | "peri";

export function getAgeGroup(age: number | undefined): AgeGroup {
  if (!age || age < 18) return "teen";
  if (age < 30) return "young";
  if (age < 43) return "mature";
  return "peri";
}

export type AgeConfig = {
  group: AgeGroup;
  label: string;
  showFertility: boolean;
  showSex: boolean;
  showIntimacy: boolean;
  showPartner: boolean;
  showVitaminDoses: boolean;
  tone: "gentle" | "normal" | "detailed";
  greeting: string;
  irregularityNote: string;
  hiddenCategories: string[];
  phaseExplanationStyle: "simple" | "full" | "menopause";
};

const configs: Record<AgeGroup, AgeConfig> = {
  teen: {
    group: "teen",
    label: "10–17 лет",
    showFertility: false,
    showSex: false,
    showIntimacy: false,
    showPartner: false,
    showVitaminDoses: false,
    tone: "gentle",
    greeting: "Привет",
    irregularityNote: "Цикл часто устанавливается первые 2-3 года. Если что-то пугает или мешает жить, лучше поговорить со взрослым и врачом.",
    hiddenCategories: ["sex", "discharge", "intimacy"],
    phaseExplanationStyle: "simple",
  },
  young: {
    group: "young",
    label: "18–29 лет",
    showFertility: true,
    showSex: true,
    showIntimacy: true,
    showPartner: true,
    showVitaminDoses: true,
    tone: "normal",
    greeting: "Привет",
    irregularityNote: "Если длина цикла сильно меняется, стоит обратить внимание и при необходимости обсудить это с врачом.",
    hiddenCategories: [],
    phaseExplanationStyle: "full",
  },
  mature: {
    group: "mature",
    label: "30–42 года",
    showFertility: true,
    showSex: true,
    showIntimacy: true,
    showPartner: true,
    showVitaminDoses: true,
    tone: "detailed",
    greeting: "Привет",
    irregularityNote: "После 35 цикл может начать меняться. Отслеживание изменений особенно важно сейчас.",
    hiddenCategories: [],
    phaseExplanationStyle: "full",
  },
  peri: {
    group: "peri",
    label: "43+ лет",
    showFertility: false,
    showSex: true,
    showIntimacy: true,
    showPartner: true,
    showVitaminDoses: true,
    tone: "detailed",
    greeting: "Привет",
    irregularityNote: "Цикл может становиться нерегулярным в переходный период. Приложение поможет отслеживать изменения и готовить вопросы врачу.",
    hiddenCategories: [],
    phaseExplanationStyle: "menopause",
  },
};

export function getAgeConfig(age: number | undefined): AgeConfig {
  return configs[getAgeGroup(age)];
}

// ── Teen-adapted phase explanations ──

export const teenPhaseCards: Record<string, { title: string; body: string; tip: string }> = {
  menstruation: {
    title: "Сейчас месячные",
    body: "Это обычный процесс взросления тела. Может быть небольшая боль в животе и усталость.",
    tip: "Грелка на живот, тёплый чай и отдых могут поддержать. Не стесняйся попросить помощи у взрослого.",
  },
  follicular: {
    title: "Энергия возвращается",
    body: "После месячных тело восстанавливается. Ты можешь чувствовать себя бодрее и веселее. Хорошее время для учёбы и спорта!",
    tip: "Ешь вкусное и полезное — фрукты, йогурт, каша. Тело сейчас набирает силы.",
  },
  ovulation: {
    title: "Середина цикла",
    body: "Сейчас ты можешь чувствовать себя лучше всего за весь месяц. Больше энергии и хорошее настроение.",
    tip: "Отличное время для любимых занятий и общения с подругами.",
  },
  luteal: {
    title: "Скоро месячные",
    body: "Тело готовится к новому циклу. Настроение может быть переменчивым, может хотеться сладкого.",
    tip: "Если грустно или раздражает, отнесись к себе мягче. Еда, сон и разговор с близким человеком могут поддержать.",
  },
};

// ── Peri-menopause adapted explanations ──

export const periPhaseCards: Record<string, { title: string; body: string; tip: string }> = {
  menstruation: {
    title: "Менструация",
    body: "Месячные могут стать нерегулярными, обильнее или скуднее — это часть перименопаузы. Важно отслеживать изменения.",
    tip: "Если кровотечение необычно сильное или длится дольше 7 дней — обсудите с врачом.",
  },
  follicular: {
    title: "Фолликулярная фаза",
    body: "Эстроген растёт, но его уровень может колебаться больше, чем раньше. Энергия и настроение улучшаются.",
    tip: "Витамин D и кальций особенно важны в этом возрасте для здоровья костей.",
  },
  ovulation: {
    title: "Середина цикла",
    body: "Овуляция может происходить не каждый цикл в перименопаузе. Беременность всё ещё возможна.",
    tip: "Отслеживайте длину циклов — если они стали значительно короче или длиннее, обсудите с врачом.",
  },
  luteal: {
    title: "Лютеиновая фаза",
    body: "Колебания гормонов могут быть сильнее. Приливы, потливость, перепады настроения — признаки перехода.",
    tip: "Регулярная активность и питание могут поддержать самочувствие. Если симптомы мешают жить, обсудите варианты поддержки с врачом.",
  },
};
